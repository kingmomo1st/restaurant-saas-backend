const dotenv = require("dotenv");
const path = require("path");

// Load environment based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, 'backendENV', envFile) });

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const cron = require("node-cron");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { admin, db } = require("./firebaseAdmin");
const sanityClient = require("./src/sanity/sanityClient.node.js");

// Import routes
const giftcardRoutes = require("./routes/giftcard");
const promoCodeRoutes = require("./routes/promoCode");
const reviewRoutes = require("./routes/reviews");
const liveOrderRoutes = require("./routes/liveOrders");
const rewardsRoutes = require("./routes/rewards");
const newsletterRoutes = require("./routes/newsletter");
const posRoutes = require("./routes/posIntegration");
const abandonedCartRoute = require("./routes/checkAbandonedCarts");
const reservationReminderRoute = require("./routes/reservationReminder");
const subscriptionRoutes = require("./routes/subscription");
const ordersRoutes = require("./routes/orders");
const reservationsRoutes = require("./routes/reservations");
const privateDiningRoutes = require("./routes/privateDining");
const eventsRouter = require('./routes/events');
const auditLogsRouter = require('./routes/audit-logs');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy (important for production behind load balancer)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

// Compression for better performance
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => {
    return req.path === '/webhook' && req.headers['stripe-signature'];
  }
});

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:3000'
        ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
};

app.use(cors(corsOptions));

// Apply rate limiting
app.use(limiter);
app.use('/webhook', webhookLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Raw body parser for Stripe webhooks ONLY
app.use('/webhook', express.raw({ type: 'application/json', limit: '10mb' }));

// JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle deletions
app.post("/sanity-webhook/private-dining-delete", async (req, res) => {
  try {
    const { _id } = req.body;
    
    if (_id) {
      await db.collection("privateDining").doc(_id).delete();
      console.log(`✅ Deleted private dining ${_id} from Firestore`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Delete webhook error:", error);
    res.status(500).json({ error: "Delete webhook failed" });
  }
});

// API Routes
app.use("/api/giftcards", giftcardRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/promo", promoCodeRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/live-orders", liveOrderRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/abandonedCarts", abandonedCartRoute);
app.use("/api/reservation-reminders", reservationReminderRoute);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/private-dining", privateDiningRoutes);
app.use('/api/events', eventsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/users', usersRouter);

// CRON Job: Abandoned Carts
cron.schedule("0 * * * *", async () => {
  console.log("🕒 Running abandoned cart check...");
  try {
    await abandonedCartRoute(
      {},
      {
        status: () => ({ json: console.log }),
        json: console.log,
      }
    );
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});

async function validatePromoInternal(promo, orderTotal, userId, locationId) {
  // Check expiration
  if (promo.expirationDate && new Date(promo.expirationDate) < new Date()) {
    return { valid: false, error: "Promo code has expired" };
  }

  // Check minimum order
  if (promo.minOrderAmount && orderTotal < promo.minOrderAmount) {
    return { valid: false, error: `Minimum order amount is $${promo.minOrderAmount}` };
  }

  // Check usage limit
  if (promo.usageLimit) {
    const redemptionSnapshot = await db.collection("promoRedemptions")
      .where("promoCode", "==", promo.code.toUpperCase())
      .get();
    const currentUsage = redemptionSnapshot.size;

    if (currentUsage >= promo.usageLimit) {
      return { valid: false, error: "Promo code usage limit reached" };
    }
  }

  // Calculate discount
  let discount = 0;
  if (promo.type === "percentage") {
    discount = (promo.value / 100) * orderTotal;
    if (promo.maxDiscount) {
      discount = Math.min(discount, promo.maxDiscount);
    }
  } else if (promo.type === "fixed") {
    discount = Math.min(promo.value, orderTotal);
  }

  return {
    valid: true,
    discount: parseFloat(discount.toFixed(2))
  };
}

// Create Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  console.log("🔥 CHECKOUT ENDPOINT HIT!", req.body);
  try {
    const {
      cart,
      userId,
      userEmail,
      shippingAddress,
      customerInfo,
      total,
      redeemPoints,
      pointsUsed,
      promoCode,
      deliveryFee = 0,
      taxAmount = 0,
      orderType = "pickup",
      locationId,
      franchiseId,
      tableId,
      happyHourDiscount = 0,
      happyHourActive = false,
      pointsToEarn = 0,
      promotionSettings
    } = req.body;

    // Convert ALL undefined values to null for Firestore (guest orders)
    const safeUserId = userId || null;
    const safeUserEmail = userEmail || null;
    const safeShippingAddress = shippingAddress || null;
    const safePromoCode = promoCode || null;
    const safeLocationId = locationId || null;
    const safeFranchiseId = franchiseId || null;
    const safeTableId = tableId || null;
    const safePointsUsed = pointsUsed || 0;
    const safeRedeemPoints = redeemPoints || false;

    console.log("🎉 CMS Promotion Settings:", promotionSettings);
    console.log("🍷 Happy Hour Active:", happyHourActive, "Discount:", happyHourDiscount);
    console.log("🏆 Points to Earn:", pointsToEarn);

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or invalid" });
    }
    if (!["pickup", "delivery"].includes(orderType)) {
      return res.status(400).json({ error: "Invalid order type" });
    }
    if (!customerInfo?.firstName || !customerInfo?.lastName || !customerInfo?.phone) {
      return res.status(400).json({ error: "Customer name and phone required" });
    }
    if (orderType === "delivery") {
      if (
        !safeShippingAddress?.address ||
        !safeShippingAddress?.city ||
        !safeShippingAddress?.state ||
        !safeShippingAddress?.zipCode
      ) {
        return res.status(400).json({ error: "Delivery address required" });
      }
    }

    // Validate loyalty points using CMS settings
    if (safeRedeemPoints && safeUserId) {
      const userDoc = await db.collection("users").doc(safeUserId).get();
      if (!userDoc.exists) {
        return res.status(400).json({ error: "User not found" });
      }
      const currentPoints = userDoc.data().loyaltyPoints || 0;
      if (currentPoints < safePointsUsed) {
        return res.status(400).json({
          error: `You have ${currentPoints} points but tried to redeem ${safePointsUsed}.`,
        });
      }
    }

    // Calculate loyalty discount using CMS settings
    const rewardThreshold = promotionSettings?.loyaltyProgram?.rewardThreshold || 100;
    const loyaltyDiscount = safeRedeemPoints ? safePointsUsed / rewardThreshold : 0;

    console.log("💳 Loyalty Calculation:", {
      pointsUsed: safePointsUsed,
      rewardThreshold,
      discount: loyaltyDiscount
    });

    // Validate promo code
    let promoDiscount = 0;
    if (safePromoCode) {
      try {
        const sanityPromo = await sanityClient.fetch(
          `*[_type == "promoCode" && code == $code && active == true][0]`,
          { code: safePromoCode.toUpperCase() }
        );

        if (!sanityPromo) {
          return res.status(400).json({ error: "Promo code not found or inactive" });
        }

        const validation = await validatePromoInternal(sanityPromo, total, safeUserId, safeLocationId);

        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }

        promoDiscount = validation.discount;

        await db.collection("promoRedemptions").add({
          promoCode: sanityPromo.code,
          userId: safeUserId || "anonymous",
          orderTotal: total,
          discountApplied: promoDiscount,
          franchiseId: safeLocationId,
          locationId: safeLocationId,
          redeemedAt: new Date()
        });

        console.log(`✅ Promo code ${sanityPromo.code} applied: $${promoDiscount} discount`);
      } catch (promoError) {
        console.error("❌ Promo validation error:", promoError);
        return res.status(400).json({ error: "Error validating promo code. Please try again." });
      }
    }

    // Calculate final total with all discounts
    const discountedTotal = Math.max(
      0,
      total - promoDiscount - loyaltyDiscount - happyHourDiscount + deliveryFee + taxAmount
    );

    console.log("💰 Final Pricing:", {
      originalTotal: total,
      promoDiscount,
      loyaltyDiscount,
      happyHourDiscount,
      deliveryFee,
      taxAmount,
      finalTotal: discountedTotal
    });

    // Proportional discount allocation for line items
    const cartSubtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalItemDiscount = loyaltyDiscount + happyHourDiscount;
    const discountRatio = totalItemDiscount > 0 ? totalItemDiscount / cartSubtotal : 0;

    const line_items = [
      ...cart.map((item) => {
        const originalItemTotal = item.price * item.quantity;
        const itemDiscount = originalItemTotal * discountRatio;
        const discountedPrice = item.price - itemDiscount / item.quantity;

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: totalItemDiscount > 0
                ? `${item.name} (Discounts applied)`
                : item.name,
            },
            unit_amount: Math.round(Math.max(1, discountedPrice * 100)),
          },
          quantity: item.quantity,
        };
      }),
      ...(deliveryFee > 0
        ? [{
            price_data: {
              currency: "usd",
              product_data: { name: "Delivery Fee" },
              unit_amount: Math.round(deliveryFee * 100),
            },
            quantity: 1,
          }]
        : []),
      ...(taxAmount > 0
        ? [{
            price_data: {
              currency: "usd",
              product_data: { name: "Sales Tax" },
              unit_amount: Math.round(taxAmount * 100),
            },
            quantity: 1,
          }]
        : []),
    ];

    // Dynamic URLs based on environment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const sessionConfig = {
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${frontendUrl}/success`,
      cancel_url: `${frontendUrl}/cancel`,
      metadata: {
        userId: safeUserId || "guest",
        promoCode: safePromoCode || "none",
        pointsUsed: safePointsUsed.toString(),
        redeemPoints: safeRedeemPoints.toString(),
        orderType,
        locationId: safeLocationId || "none",
        franchiseId: safeFranchiseId || "none",
        tableId: safeTableId || "none",
        deliveryFee: deliveryFee.toString(),
        taxAmount: taxAmount.toString(),
        totalBeforeDiscounts: total.toString(),
        finalChargedAmount: discountedTotal.toString(),
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerPhone: customerInfo.phone,
        cartSummary: `${cart.length} items - $${discountedTotal}`,
        deliveryType: orderType,
        happyHourDiscount: happyHourDiscount.toString(),
        happyHourActive: happyHourActive.toString(),
        pointsToEarn: pointsToEarn.toString(),
        loyaltyDiscount: loyaltyDiscount.toString(),
        rewardThreshold: rewardThreshold.toString(),
        ...(orderType === "delivery" && safeShippingAddress && {
          deliveryCity: `${safeShippingAddress.city}, ${safeShippingAddress.state}`,
        }),
      },
    };

    // Add customer email if valid
    if (safeUserEmail && safeUserEmail.includes("@")) {
      sessionConfig.customer_email = safeUserEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Store enhanced order data in pending orders
    await db.collection("pendingOrders").doc(session.id).set({
      userId: safeUserId,
      email: safeUserEmail,
      cart,
      orderType,
      customerInfo,
      shippingAddress: orderType === "delivery" ? safeShippingAddress : null,
      promoCode: safePromoCode,
      promoDiscount,
      pointsUsed: safePointsUsed,
      loyaltyDiscount,
      redeemPoints: safeRedeemPoints,
      deliveryFee,
      taxAmount,
      locationId: safeLocationId,
      franchiseId: safeFranchiseId,
      tableId: safeTableId,
      originalTotal: total,
      finalTotal: discountedTotal,
      happyHourDiscount,
      happyHourActive,
      pointsToEarn,
      promotionSettings,
      rewardThreshold,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
    });

    console.log(`✅ Created checkout session: ${session.id}`);
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Stripe Webhook
app.post("/webhook", async (req, res) => {
  console.log("🔥 WEBHOOK CALLED! Headers:", req.headers);
  console.log("🔥 WEBHOOK BODY LENGTH:", req.body?.length);
  
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log("🔥 WEBHOOK SECRET EXISTS:", !!endpointSecret);
  console.log("🔥 SIGNATURE EXISTS:", !!sig);

  let event;
  try {
    const payload = req.body;
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    console.log("🔥 WEBHOOK EVENT TYPE:", event.type);
  } catch (err) {
    console.error("❌ Stripe webhook signature error:", err.message);
    
    // For development with ngrok, fall back to parsing without verification
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔧 Development mode: parsing webhook without signature verification");
      try {
        event = JSON.parse(req.body.toString());
        console.log("🔥 WEBHOOK EVENT TYPE (unverified):", event.type);
      } catch (parseErr) {
        console.error("❌ Failed to parse webhook body:", parseErr.message);
        return res.status(400).send(`Webhook Error: ${parseErr.message}`);
      }
    } else {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(`🎉 Payment completed for session: ${session.id}`);
  
    try {
      console.log("🔍 Session metadata:", JSON.stringify(session.metadata, null, 2));
      
      const isGiftCard = Boolean(
        session.metadata?.giftCode || 
        session.metadata?.recipientEmail || 
        session.metadata?.senderName ||
        (session.metadata?.amount && session.metadata?.recipientName)
      );
  
      console.log("🔍 Is gift card?", isGiftCard);
  
      if (isGiftCard) {
        console.log("🎁 Processing GIFT CARD payment...");
        await handleGiftCardPayment(session);
      } else {
        console.log("🛒 Processing REGULAR ORDER payment...");
        await handleOrderPayment(session);
      }
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
    }
  }
  
  res.status(200).send("Webhook received");
});

async function handleGiftCardPayment(session) {
  try {
    const metadata = session.metadata;
    console.log("🎁 Processing gift card with metadata:", metadata);

    const giftCardData = {
      senderName: metadata.senderName,
      recipientName: metadata.recipientName,
      recipientEmail: metadata.recipientEmail,
      message: metadata.message || "",
      amount: parseFloat(metadata.amount),
      initialAmount: parseFloat(metadata.amount),
      remainingAmount: parseFloat(metadata.amount),
      giftCode: metadata.giftCode,
      status: "paid",
      redeemed: false,
      stripeSessionId: session.id,
      franchiseId: metadata.franchiseId || null,
      locationId: metadata.locationId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("giftcards").add(giftCardData);
    console.log("✅ Gift card saved to Firestore");

    console.log("📧 Attempting to send gift card email...");
    const { sendGiftCardEmail } = require("./services/emailService");

    await sendGiftCardEmail(
      giftCardData.recipientEmail,
      giftCardData.senderName,
      giftCardData.recipientName,
      giftCardData.message,
      giftCardData.giftCode,
      giftCardData.amount,
      giftCardData.locationId
    );

    console.log("✅ Gift card email sent successfully!");
  } catch (err) {
    console.error("❌ Gift card processing error:", err);
  }
}

async function handleOrderPayment(session) {
  try {
    console.log(`🔍 Looking for pending order: ${session.id}`);
    const pendingDoc = await db.collection("pendingOrders").doc(session.id).get();
    console.log(`🔍 Pending doc exists: ${pendingDoc.exists}`);
    
    if (pendingDoc.exists) {
      const orderData = pendingDoc.data();
      console.log(`🔍 Order data found:`, orderData);
      console.log(`🔍 About to save order to Firebase...`);
    
      const earnedPoints = Math.round(orderData.finalTotal);

      await db.collection("orders").doc(session.id).set({
        ...orderData,
        status: "confirmed",
        franchiseId: 'fallback1',
        locationId: orderData.locationId,
        paymentIntentId: session.payment_intent,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        estimatedTime: orderData.orderType === "pickup" ? "15-20 minutes" : "30-45 minutes",
      });
      console.log(`🔍 Order saved to Firebase successfully!`);

      if (orderData.userId && orderData.userId !== "guest" && orderData.userId !== null) {
        const userRef = db.collection("users").doc(orderData.userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          let currentPoints = userDoc.data().loyaltyPoints || 0;
          if (orderData.redeemPoints) currentPoints -= orderData.pointsUsed;
          currentPoints += earnedPoints;

          await userRef.update({
            loyaltyPoints: currentPoints,
            purchaseHistory: admin.firestore.FieldValue.arrayUnion({
              orderId: session.id,
              items: orderData.cart,
              total: orderData.originalTotal,
              discountedTotal: orderData.finalTotal,
              promoCode: orderData.promoCode || null,
              promoDiscount: orderData.promoDiscount || 0,
              pointsUsed: orderData.pointsUsed,
              pointsEarned: earnedPoints,
              orderType: orderData.orderType,
              date: new Date().toISOString(),
            }),
          });
        }
      }

      await pendingDoc.ref.delete();
      console.log(`✅ Order ${session.id} confirmed.`);
    }
  } catch (err) {
    console.error("❌ Order processing error:", err);
  }
}

// Debug routes
app.get("/api/debug/check-data", async (req, res) => {
  try {
    const reservationsSnapshot = await db.collection("reservations").limit(5).get();
    const reservations = reservationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const ordersSnapshot = await db.collection("orders").limit(5).get();
    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const allFranchiseIds = [
      ...reservations.map((r) => r.franchiseId),
      ...orders.map((o) => o.franchiseId),
    ].filter(Boolean);

    const uniqueFranchiseIds = [...new Set(allFranchiseIds)];

    res.json({
      message: "Debug data check",
      sampleReservations: reservations,
      sampleOrders: orders,
      uniqueFranchiseIds,
      totalReservations: reservationsSnapshot.size,
      totalOrders: ordersSnapshot.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Debug route error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

app.get("/api/debug/test-filter", async (req, res) => {
  try {
    const { franchiseId } = req.query;

    console.log("🔍 Testing filter with franchiseId:", franchiseId);

    let query = db.collection("reservations");

    if (franchiseId) {
      console.log("📋 Adding franchise filter...");
      query = query.where("franchiseId", "==", franchiseId);
    }

    const snapshot = await query.get();
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      franchiseId: doc.data().franchiseId,
      customerName: doc.data().customerName,
      status: doc.data().status,
    }));

    console.log(`✅ Filter test complete: ${results.length} results`);

    res.json({
      message: "Filter test",
      filterUsed: franchiseId || "none",
      resultsCount: results.length,
      results: results.slice(0, 3),
      allFranchiseIds: results.map((r) => r.franchiseId).filter(Boolean),
    });
  } catch (error) {
    console.error("❌ Filter test error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/*',
      'POST /webhook',
      'POST /create-checkout-session'
    ]
  });
});

// Apply error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔐 Production mode: Enhanced security enabled`);
  }
});

module.exports = app;
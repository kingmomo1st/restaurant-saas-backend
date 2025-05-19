const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const { admin, db } = require("./firebaseAdmin");
const giftcardRoutes= require ("./routes/giftcard");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const app = express();
const port = process.env.PORT || 5001;


app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use("/api/giftcards", giftcardRoutes);




// === STRIPE CHECKOUT + LOYALTY TRACKING ===
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart, userId, userEmail, shippingAddress, total, redeemPoints, pointsUsed } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty or not provided" });
    }

    const line_items = cart.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const discountedTotal = redeemPoints ? total - pointsUsed : total;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free shipping",
          },
        },
      ],
    });

    // Loyalty system
    if (userId && userEmail) {
      try {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        const newPurchase = {
          orderId: session.id,
          items: cart,
          total: Number(total),
          date: new Date().toISOString(),
          pointsUsed: redeemPoints ? Number(pointsUsed) : 0,
        };

        if (userDoc.exists) {
          const userData = userDoc.data();
          let updatedPoints = userData.points || 0;

          if (redeemPoints) {
            updatedPoints -= Number(pointsUsed);
          }

          updatedPoints += Math.round(discountedTotal);

          await userRef.update({
            points: updatedPoints,
            purchaseHistory: admin.firestore.FieldValue.arrayUnion(newPurchase),
          });
        } else {
          await userRef.set({
            email: userEmail,
            points: Math.round(discountedTotal),
            purchaseHistory: [newPurchase],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Error updating loyalty data:", err);
      }
    }

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).send("Internal Server Error");
  }
});

// === ADMIN ROLE ASSIGNMENT ===
app.post("/set-admin-role", async (req, res) => {
  const { uid } = req.body;
  const idToken = req.headers.authorization;

  if (!idToken) return res.status(401).json({ error: "Unauthorized. No token provided" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requesterClaims = decodedToken.claims;

    if (!requesterClaims.admin) {
      return res.status(403).json({ error: "Forbidden. Only admin can set admin roles." });
    }

    if (!uid) return res.status(400).json({ error: "UID is required" });

    const userRecord = await admin.auth().getUser(uid);
    const existingClaims = userRecord.customClaims || {};

    await admin.auth().setCustomUserClaims(uid, {
      ...existingClaims,
      admin: true,
    });

    res.status(200).json({ message: `Admin role added to ${uid}` });
  } catch (error) {
    console.error("Error setting admin role:", error);
    res.status(500).json({ error: "Failed to set admin role" });
  }
});

// === RESERVATION ROUTES ===
app.get("/api/reservations", async (req, res) => {
  try {
    const snapshot = await db.collection("reservations").get();
    const reservations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || doc.data().date,
    }));
    res.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

app.post("/api/reservations", async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection("reservations").add(data);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding reservation:", error);
    res.status(500).json({ error: "Failed to add reservation" });
  }
});

app.put("/api/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("reservations").doc(id).update(req.body);
    res.json({ message: "Reservation updated successfully" });
  } catch (error) {
    console.error("Error updating reservation:", error);
    res.status(500).json({ error: "Failed to update reservation" });
  }
});

app.delete("/api/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("reservations").doc(id).delete();
    res.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ error: "Failed to delete reservation" });
  }
});

// === PRIVATE DINING ROUTES ===
app.get("/api/private-dining", async (req, res) => {
  try {
    const snapshot = await db.collection("privateDining").get();
    const privateDining = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || doc.data().date,
    }));
    res.json(privateDining);
  } catch (error) {
    console.error("Error fetching private dining:", error);
    res.status(500).json({ error: "Failed to fetch private dining" });
  }
});

app.post("/api/private-dining", async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection("privateDining").add(data);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding private dining:", error);
    res.status(500).json({ error: "Failed to add private dining" });
  }
});

app.put("/api/private-dining/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("privateDining").doc(id).update(req.body);
    res.json({ message: "Private dining updated successfully" });
  } catch (error) {
    console.error("Error updating private dining:", error);
    res.status(500).json({ error: "Failed to update private dining" });
  }
});

app.delete("/api/private-dining/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("privateDining").doc(id).delete();
    res.json({ message: "Private dining deleted successfully" });
  } catch (error) {
    console.error("Error deleting private dining:", error);
    res.status(500).json({ error: "Failed to delete private dining" });
  }
});

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata;

    const giftCardData = {
      senderName: metadata.senderName,
      recipientName: metadata.recipientName,
      recipientEmail: metadata.recipientEmail,
      message: metadata.message,
      amount: parseFloat(session.amount_total / 100),
      status: "paid",
      redeemed: false,
      stripeSessionId: session.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await db.collection("giftcards").add(giftCardData);
      console.log("Gift card saved after Stripe payment");
    } catch (err) {
      console.error("Error saving gift card to Firestore:", err);
    }
  }

  res.json({ received: true });
});

// === START SERVER ===
app.listen(port, () => {
  console.log(`Server is ON at http://localhost:${port}`);
});
const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const sanityClient = require("../src/sanity/sanityClient.node.js");
const { sendGiftCardEmail } = require("../services/emailService");

// === GET Gift Cards ===
router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId } = req.query;

    let query = db.collection("giftcards");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }

    const snapshot = await query.get();
    const giftCards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${giftCards.length} gift cards`);
    res.json(giftCards);
  } catch (error) {
    console.error("❌ Error fetching gift cards:", error);
    res.status(500).json({ error: "Failed to fetch gift cards" });
  }
});

// === Gift Code Generator ===
const generateGiftCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// === Validate Gift Card ===
router.post("/validate", async (req, res) => {
  const { email, giftCode, locationId, checkOnly } = req.body;

  if (!giftCode) {
    return res.status(400).json({ error: "Gift code is required." });
  }

  try {
    const snap = await db
      .collection("giftcards")
      .where("giftCode", "==", giftCode)
      .where("locationId", "==", locationId)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "Gift card not found." });
    }

    const giftCard = snap.docs[0].data();

    if (giftCard.redeemed || giftCard.remainingAmount <= 0) {
      return res.status(400).json({ error: "Gift card has no remaining balance." });
    }

    return res.status(200).json({
      giftCode: giftCard.giftCode,
      remainingAmount: giftCard.remainingAmount,
      initialAmount: giftCard.initialAmount,
      status: "valid",
    });
  } catch (err) {
    console.error("Validation error:", err);
    return res.status(500).json({ error: "Failed to validate gift card." });
  }
});

// === Create Checkout Session === (ENHANCED VERSION)
router.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      senderName,
      recipientName,
      recipientEmail,
      message,
      amount,
      franchiseId,
      locationId,
      // 🔥 NEW: Accept CMS settings from frontend
      designTemplate,
      expiryMonths
    } = req.body;

    console.log("🎁 Gift card checkout request:", {
      senderName,
      recipientName,
      recipientEmail,
      amount,
      franchiseId,
      locationId,
      designTemplate, // 🔥 NEW
      expiryMonths    // 🔥 NEW
    });

    if (!senderName || !recipientName || !recipientEmail || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔥 NEW: Optional backend validation using CMS settings
    const numAmount = parseFloat(amount);
    if (numAmount < 1) {
      return res.status(400).json({ error: "Invalid gift card amount" });
    }

    const giftCode = generateGiftCode();

    // 🔥 NEW: Calculate expiry date using CMS setting
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (expiryMonths || 12));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Gift Card for ${recipientName}`,
            description: message || `From ${senderName}`,
            // 🔥 NEW: Add design template info
            metadata: {
              designTemplate: designTemplate || "classic"
            }
          },
          unit_amount: Math.round(numAmount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?giftCode=${giftCode}&type=giftcard`,
      cancel_url: `${process.env.FRONTEND_URL}/giftcard`,
      metadata: {
        senderName,
        recipientName,
        recipientEmail,
        message: message || "",
        amount,
        giftCode,
        franchiseId: franchiseId || null,
        locationId: locationId || null,
        // 🔥 NEW: Store CMS settings in Stripe metadata
        designTemplate: designTemplate || "classic",
        expiryMonths: expiryMonths || 12,
        expiryDate: expiryDate.toISOString()
      },
    });

    console.log("✅ Gift card checkout session created:", session.id);
    res.json({ url: session.url });

  } catch (error) {
    console.error("❌ Stripe session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// 🔥 OPTIONAL: Add endpoint to get CMS gift card settings
router.get("/settings/:locationId", async (req, res) => {
  try {
    const { locationId } = req.params;

    // Fetch from Sanity CMS
    const settings = await sanityClient.fetch(
      `*[_type == "giftCardSettings" && location._ref == "${locationId}"][0]{
        presetAmounts,
        minAmount,
        maxAmount,
        expiryMonths,
        designTemplate,
        allowCustomAmounts,
        defaultMessage,
        termsAndConditions
      }`
    );

    if (!settings) {
      // Return default settings if none found
      return res.json({
        presetAmounts: [25, 50, 75, 100, 150, 200],
        minAmount: 10,
        maxAmount: 500,
        expiryMonths: 12,
        designTemplate: "classic",
        allowCustomAmounts: true,
        defaultMessage: "Enjoy a wonderful dining experience!",
        termsAndConditions: ""
      });
    }

    res.json(settings);

  } catch (error) {
    console.error("❌ Error fetching gift card settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.post("/redeem", async (req, res) => {
  const { email, giftCode, amountToUse, userId, locationId } = req.body;

  if (!email || !giftCode) {
    return res.status(400).json({ error: "Email and gift code are required." });
  }

  try {
    const snap = await db
      .collection("giftcards")
      .where("recipientEmail", "==", email)
      .where("giftCode", "==", giftCode)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "Gift card not found." });
    }

    const doc = snap.docs[0];
    const giftCard = doc.data();
    const docRef = doc.ref;

    if (giftCard.redeemed || giftCard.remainingAmount <= 0) {
      return res.status(400).json({ error: "Gift card already fully redeemed." });
    }

    const amount = amountToUse ? parseFloat(amountToUse) : giftCard.remainingAmount;

    if (amount > giftCard.remainingAmount) {
      return res.status(400).json({ error: "Amount exceeds remaining balance." });
    }

    const newRemaining = giftCard.remainingAmount - amount;
    const isFullyRedeemed = newRemaining <= 0;

    await docRef.update({
      remainingAmount: newRemaining,
      redeemed: isFullyRedeemed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Firestore updated successfully");

    // ✅ BACKEND LOGGING TO adminLogs
    try {
      await db.collection("adminLogs").add({
        action: "Redeem Gift Card",
        message: `Gift card ${giftCard.giftCode} redeemed for $${amount}`,
        user: email || "guest",
        meta: {
          giftCardId: doc.id,
          redeemedAmount: amount,
          remainingAmount: newRemaining,
          locationId: locationId || null,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("✅ Action logged to adminLogs");
    } catch (logError) {
      console.warn("⚠️ Logging failed:", logError.message);
    }

    // ✅ Optional Sanity sync
    try {
      if (giftCard.giftCode) {
        console.log("🔄 Attempting Sanity sync...");
        const sanityQuery = `*[_type == "giftCardView" && giftCode == "${giftCard.giftCode}"][0]{_id}`;
        const sanityRes = await sanityClient.fetch(sanityQuery);

        if (sanityRes?._id) {
          await sanityClient
            .patch(sanityRes._id)
            .set({
              remainingAmount: newRemaining,
              redeemed: isFullyRedeemed,
              updatedAt: new Date().toISOString(),
            })
            .commit();
          console.log("✅ Sanity sync completed");
        } else {
          console.log("ℹ️ No Sanity record found for this gift card");
        }
      }
    } catch (sanityError) {
      console.warn("⚠️ Sanity sync failed (but Firestore updated):", sanityError.message);
    }

    return res.json({
      message: "Gift card redeemed successfully.",
      giftCardId: doc.id,
      giftCode: giftCard.giftCode,
      redeemedAmount: amount,
      remainingAmount: newRemaining,
      userId,
    });
  } catch (err) {
    console.error("❌ Redeem error:", err);
    return res.status(500).json({ error: "Failed to redeem gift card." });
  }
});

module.exports = router;
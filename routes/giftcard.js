const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



// Create checkout session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { senderName, recipientName, recipientEmail, message, amount } = req.body;

    if (!senderName || !recipientName || !recipientEmail || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Gift Card for ${recipientName}`,
            description: message || `From ${senderName}`,
          },
          unit_amount: Math.round(parseFloat(amount) * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/giftcard`,
      metadata: {
        senderName,
        recipientName,
        recipientEmail,
        message,
        amount,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Redeem gift card
router.post("/redeem", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const snapshot = await db.collection("giftcards")
      .where("recipientEmail", "==", email)
      .where("status", "==", "paid")
      .where("redeemed", "==", false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No valid or unredeemed gift card found for this email" });
    }

    const doc = snapshot.docs[0];
    const docRef = db.collection("giftcards").doc(doc.id);

    await docRef.update({
      status: "redeemed",
      redeemed: true,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Gift card redeemed", amount: doc.data().amount });
  } catch (error) {
    console.error("Redeem error:", error);
    res.status(500).json({ error: "Failed to redeem gift card" });
  }
});

module.exports = router;
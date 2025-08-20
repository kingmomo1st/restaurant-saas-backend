// routes/subscription.js
const express = require("express");
require("dotenv").config({ path: "./backendENV/.env" }); // Adjust if the path is different
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
console.log("✅ STRIPE KEY:", process.env.STRIPE_SECRET_KEY);
const { db, admin } = require("../firebaseAdmin");

router.post("/create-subscription-session", async (req, res) => {
  try {
    const { userEmail, userId, plan, locationId = "default" } = req.body;

    const priceMap = {
      starter: "price_1RV4rx2MBfempGzHJSC02KrI", // 🔁 Replace with actual price ID (not product ID)
      pro: "price_1RV4sk2MBfempGzH5KoywTME",
      elite: "price_1RV4tV2MBfempGzHoKdtpVxu"
    };

    const priceId = priceMap[plan];
    if (!priceId) return res.status(400).json({ error: "Invalid plan selected" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?subscription=cancel`,
      metadata: {
        userId,
        plan,
        locationId
      },
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Subscription session error:", error);
    res.status(500).json({ error: "Failed to create subscription session" });
  }
});

router.post("/cancel-subscription", async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: "Missing subscriptionId" });

    const canceledSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update Firestore for UI feedback
    await db.collection("subscriptions").doc(subscriptionId).set(
      {
        cancel_at_period_end: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ success: true, status: canceledSub.status });
  } catch (error) {
    console.error("❌ Cancel Subscription Error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

router.post("/resume-subscription", async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: "Missing subscriptionId" });

    const resumedSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    // Update Firestore for UI feedback
    await db.collection("subscriptions").doc(subscriptionId).set(
      {
        cancel_at_period_end: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ success: true, status: resumedSub.status });
  } catch (error) {
    console.error("❌ Resume Subscription Error:", error);
    res.status(500).json({ error: "Failed to resume subscription" });
  }
});

router.get("/invoices/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    if (!userEmail) return res.status(400).json({ error: "Missing user email" });

    const customers = await stripe.customers.list({ email: userEmail });
    if (!customers.data.length) return res.json([]);

    const customerId = customers.data[0].id;
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50, // get more invoices for pagination
    });

    const enriched = invoices.data.map((inv) => ({
      id: inv.id,
      created: inv.created,
      amount_paid: inv.amount_paid,
      status: inv.status,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      plan_nickname:
        inv.lines?.data[0]?.price?.nickname || inv.lines?.data[0]?.price?.id,
      billing_period_start: inv.lines?.data[0]?.period?.start,
      billing_period_end: inv.lines?.data[0]?.period?.end,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("❌ Error fetching invoices:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

module.exports = router;
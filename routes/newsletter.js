const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");
const mailchimp = require("@mailchimp/mailchimp_marketing");

// Configure Mailchimp
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., "us6"
});

// Subscribe to newsletter
router.post("/subscribe", async (req, res) => {
  try {
    const { email, locationId, franchiseId, source } = req.body;

    if (!email || !locationId) {
      return res.status(400).json({ error: "Email and location are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const listId = getMailchimpListId(franchiseId);
    if (!listId) {
      return res.status(400).json({ error: "Newsletter not configured for this location" });
    }

    // Subscribe to Mailchimp
    const mailchimpResponse = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        LOCATION: locationId,
        FRANCHISE: franchiseId,
        SOURCE: source || "website",
      },
      tags: [
        `location-${locationId}`,
        `franchise-${franchiseId}`,
        source || "website",
      ],
    });

    // Save to Firestore
    const newsletterData = {
      email,
      locationId,
      franchiseId,
      source: source || "website",
      mailchimpId: mailchimpResponse.id,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "subscribed",
    };

    await db.collection("newsletterSubscriptions").add(newsletterData);

    console.log(`✅ Newsletter subscription: ${email} for ${franchiseId}`);
    res.status(200).json({
      message: "Successfully subscribed to newsletter",
      mailchimpId: mailchimpResponse.id,
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    if (error.status === 400 && error.response?.body?.title === "Member Exists") {
      return res.status(400).json({ error: "This email is already subscribed to our newsletter" });
    }

    if (error.status === 400 && error.response?.body?.title === "Invalid Resource") {
      return res.status(400).json({ error: "Invalid email address" });
    }

    res.status(500).json({ error: "Failed to subscribe to newsletter" });
  }
});

// Unsubscribe from newsletter
router.post("/unsubscribe", async (req, res) => {
  try {
    const { email, franchiseId } = req.body;

    if (!email || !franchiseId) {
      return res.status(400).json({ error: "Email and franchise ID are required" });
    }

    const listId = getMailchimpListId(franchiseId);
    if (!listId) {
      return res.status(400).json({ error: "Newsletter not configured for this location" });
    }

    await mailchimp.lists.updateListMember(listId, email, {
      status: "unsubscribed",
    });

    const subscriptionQuery = await db
      .collection("newsletterSubscriptions")
      .where("email", "==", email)
      .where("franchiseId", "==", franchiseId)
      .limit(1)
      .get();

    if (!subscriptionQuery.empty) {
      const doc = subscriptionQuery.docs[0];
      await doc.ref.update({
        status: "unsubscribed",
        unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ message: "Successfully unsubscribed from newsletter" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    res.status(500).json({ error: "Failed to unsubscribe from newsletter" });
  }
});

// Helper function to map franchiseId to Mailchimp list ID
function getMailchimpListId(franchiseId) {
  const franchiseListMap = {
    "2d61d79d-ef5f-498e-97e4-0224ac4841b7": process.env.MAILCHIMP_ROMA_CUCINA_LIST_ID,
    "44594aa6-5d2e-430e-aa98-21e942e3b2ea": process.env.MAILCHIMP_SALUMERIA_LIST_ID,
    // Add more as you expand
  };

  return franchiseListMap[franchiseId] || process.env.MAILCHIMP_DEFAULT_LIST_ID;
}

module.exports = router;
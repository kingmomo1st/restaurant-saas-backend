const express = require("express");
const router = express.Router();
const { sendAbandonedCartEmail } = require("../services/emailService.js");
const { db } = require("../firebaseAdmin"); // ✅ use the backend Firestore admin SDK

router.post("/check-abandoned-carts", async (req, res) => {
try {
const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;


// 🔥 FIXED: Use proper Admin SDK syntax
const snapshot = await db.collection("carts").get();
const abandonedCarts = [];

for (const docSnap of snapshot.docs) {
  const data = docSnap.data();
  const updatedAt = data.updatedAt?.toDate?.() || new Date(0);
  const isAbandoned = updatedAt.getTime() < sixHoursAgo;
  const hasItems = Array.isArray(data.items) && data.items.length > 0;

  if (isAbandoned && hasItems && !data.reminderSent && data.email) {
    // 🔥 UPDATED: Send CMS-enabled abandoned cart email
    await sendAbandonedCartEmail({
      to: data.email,
      customerName: data.name,
      cartItems: data.items,
      locationId: data.locationId || data.franchiseId || null // 🔥 ADD THIS for CMS templates
    });

    // 🔥 FIXED: Use proper Admin SDK syntax
    await db.collection("carts").doc(docSnap.id).update({
      reminderSent: true,
    });

    // 🔥 FIXED: Use proper Admin SDK syntax
    await db.collection("logActions").add({
      timestamp: new Date(),
      action: "Abandoned Cart Email",
      description: `Reminder email sent to ${data.email}`,
      actor: "System",
      franchiseId: data.franchiseId || null,
      franchiseName: data.franchiseName || null,
      locationId: data.locationId || null,
      locationName: data.locationName || null,
    });

    abandonedCarts.push(data.email);
    console.log(`✅ CMS abandoned cart email sent to: ${data.email}`);
  }
}

res.status(200).json({
  success: true,
  message: `Reminder sent to ${abandonedCarts.length} user(s).`,
  emails: abandonedCarts,
});


} catch (err) {
console.error("Error checking abandoned carts:", err);
res.status(500).json({
success: false,
message: "Failed to check abandoned carts",
});
}
});

module.exports = router;
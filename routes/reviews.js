const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");
const sanityClient = require("../src/sanity/sanityClient.node.js");

// ✅ GET /api/reviews - Query Firestore
router.get("/", async (req, res) => {
  const { franchiseId, locationId, status } = req.query;

  try {
    console.log("🔍 Fetching reviews from Firestore…");

    let query = db.collection("reviews");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Reviews: Fetched ${reviews.length} reviews from Firestore`);
    res.json(reviews);
  } catch (err) {
    console.error("❌ Error fetching reviews from Firestore:", err);
    res.status(500).json({
      error: "Server error fetching reviews",
      details: err.message,
    });
  }
});

// ✅ DELETE /api/reviews/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("reviews").doc(id).delete();
    console.log(`✅ Review ${id} deleted from Firestore`);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting review:", err);
    res.status(500).json({ error: "Server error deleting review" });
  }
});

// ✅ POST /api/reviews/submit
router.post("/submit", async (req, res) => {
  const { menuItemId, userEmail, rating, comment, locationId } = req.body;

  if (!menuItemId || !userEmail || !rating || !locationId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const snap = await db
      .collection("users")
      .where("email", "==", userEmail)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(403).json({ error: "User not found." });
    }

    const userDoc = snap.docs[0];
    const purchaseHistory = userDoc.data().purchaseHistory || [];

    const hasPurchased = purchaseHistory.some((order) =>
      order.items?.some((item) => item.id?.includes(menuItemId))
    );

    if (!hasPurchased) {
      return res.status(403).json({
        error: "You must purchase this item to review it.",
      });
    }

    // Prepare review data
    const reviewData = {
      targetType: "menu",
      targetId: menuItemId,
      customerType: "customer",
      customerName: userEmail,
      rating,
      comment,
      status: "approved",
      locationId,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore
    await db.collection("reviews").add(reviewData);

    // Save to Sanity
    await sanityClient.create({
      _type: "review",
      menuItem: { _type: "reference", _ref: menuItemId },
      userEmail,
      rating,
      comment,
      verified: true,
      status: "pending",
      location: { _type: "reference", _ref: locationId },
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ message: "Review submitted successfully." });
  } catch (err) {
    console.error("❌ Error submitting review:", err);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
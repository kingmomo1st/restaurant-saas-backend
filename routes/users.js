const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId } = req.query;
    let query = db.collection("users");
    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    query = query.orderBy("createdAt", "desc").limit(1000);
    const snapshot = await query.get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      const loyaltyPoints = data.loyaltyPoints || 0;
      const getTier = (points) => {
        if (points >= 1000) return "Platinum";
        if (points >= 500) return "Gold";
        if (points >= 250) return "Silver";
        return "Bronze";
      };
      return {
        id: doc.id,
        name: data.name || "Unknown User",
        email: data.email || "No email",
        loyaltyPoints,
        tier: getTier(loyaltyPoints),
        totalSpent: data.totalSpent || 0,
        orderCount: data.orderCount || 0,
        lastOrderDate: data.lastOrderDate || null,
        franchiseId: data.franchiseId || null,
        locationId: data.locationId || null,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        status: data.status || "active",
        phone: data.phone || null,
        birthday: data.birthday || null,
        preferences: data.preferences || {},
        notes: data.notes || ""
      };
    });
    console.log(`✅ Fetched ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users", details: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    delete updateData.tier;
    delete updateData.progress;
    delete updateData.nextTierTarget;
    delete updateData.pointsToNextTier;
    delete updateData.isVIP;
    await db.collection("users").doc(id).update(updateData);
    console.log(`✅ Updated user: ${id}`);
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/:id/points", async (req, res) => {
  try {
    const { id } = req.params;
    const { points, reason, action = "add" } = req.body;
    if (!points || !reason) {
      return res.status(400).json({ error: "Points amount and reason are required" });
    }
    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userDoc.data();
    const currentPoints = userData.loyaltyPoints || 0;
    const pointsChange = action === "add" ? parseInt(points) : -parseInt(points);
    const newPoints = Math.max(0, currentPoints + pointsChange);
    await userRef.update({ loyaltyPoints: newPoints, updatedAt: new Date().toISOString() });
    await db.collection("pointsTransactions").add({
      userId: id,
      userEmail: userData.email || "Unknown",
      action,
      points: parseInt(points),
      pointsChange,
      previousPoints: currentPoints,
      newPoints,
      reason,
      franchiseId: userData.franchiseId || null,
      locationId: userData.locationId || null,
      createdAt: new Date().toISOString(),
      createdBy: req.body.createdBy || "Admin"
    });
    console.log(`✅ ${action === "add" ? "Added" : "Subtracted"} ${points} points to user ${id}`);
    res.json({
      success: true,
      message: `Successfully ${action === "add" ? "added" : "subtracted"} ${points} points`,
      previousPoints: currentPoints,
      newPoints,
      pointsChange
    });
  } catch (error) {
    console.error("❌ Error updating user points:", error);
    res.status(500).json({ error: "Failed to update user points" });
  }
});

router.get("/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db
      .collection("pointsTransactions")
      .where("userId", "==", id)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const transactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Fetched ${transactions.length} transactions for user ${id}`);
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching user transactions:", error);
    res.status(500).json({ error: "Failed to fetch user transactions" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const { franchiseId, locationId } = req.query;
    let query = db.collection("users");
    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    const snapshot = await query.get();
    const users = snapshot.docs.map((doc) => doc.data());
    const stats = {
      totalUsers: users.length,
      totalPoints: users.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0),
      averagePoints:
        users.length > 0
          ? users.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0) / users.length
          : 0,
      tierBreakdown: {
        Bronze: users.filter((u) => (u.loyaltyPoints || 0) < 250).length,
        Silver: users.filter((u) => (u.loyaltyPoints || 0) >= 250 && (u.loyaltyPoints || 0) < 500).length,
        Gold: users.filter((u) => (u.loyaltyPoints || 0) >= 500 && (u.loyaltyPoints || 0) < 1000).length,
        Platinum: users.filter((u) => (u.loyaltyPoints || 0) >= 1000).length
      },
      vipUsers: users.filter((u) => (u.loyaltyPoints || 0) >= 1000).length,
      activeUsers: users.filter((u) => u.status !== "inactive").length,
      topSpenders: users
        .filter((u) => u.totalSpent > 0)
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 10)
        .map((u) => ({
          name: u.name || "Unknown",
          email: u.email || "No email",
          totalSpent: u.totalSpent || 0,
          loyaltyPoints: u.loyaltyPoints || 0
        }))
    };
    console.log(`✅ Generated loyalty stats: ${stats.totalUsers} users`);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error generating loyalty stats:", error);
    res.status(500).json({ error: "Failed to generate loyalty statistics" });
  }
});

module.exports = router;
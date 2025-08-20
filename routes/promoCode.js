const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// POST /api/promo-codes/validate - Validate promo code (logic only)
router.post("/validate", async (req, res) => {
  const { code, orderTotal, userId, franchiseId, locationId, promoData } = req.body;

  if (!code || !orderTotal || !promoData) {
    return res.status(400).json({ error: "Code, order total, and promo data are required" });
  }

  try {
    const promo = promoData;

    // Check active
    if (!promo.active) {
      return res.status(400).json({ error: "Promo code is inactive" });
    }

    // Check expiration
    if (promo.expirationDate && new Date(promo.expirationDate) < new Date()) {
      return res.status(400).json({ error: "Promo code has expired" });
    }

    // Check minimum order
    if (promo.minOrderAmount && orderTotal < promo.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount is $${promo.minOrderAmount}`
      });
    }

    // Check usage limit
    if (promo.usageLimit) {
      const redemptionSnapshot = await db.collection("promoRedemptions")
        .where("promoCode", "==", code.toUpperCase())
        .get();
      const currentUsage = redemptionSnapshot.size;

      if (currentUsage >= promo.usageLimit) {
        return res.status(400).json({ error: "Promo code usage limit reached" });
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

    res.json({
      valid: true,
      discount: parseFloat(discount.toFixed(2)),
      code: promo.code,
      type: promo.type,
      value: promo.value,
      message: `Discount of $${discount.toFixed(2)} applied`
    });

  } catch (error) {
    console.error("❌ Promo validation error:", error);
    res.status(500).json({ error: "Something went wrong validating promo code" });
  }
});

// POST /api/promo-codes/redeem - Record promo redemption
router.post("/redeem", async (req, res) => {
  const { code, orderTotal, discount, userId, orderId, franchiseId, locationId } = req.body;

  if (!code || !orderTotal || !discount) {
    return res.status(400).json({ error: "Missing required redemption data" });
  }

  try {
    await db.collection("promoRedemptions").add({
      promoCode: code.toUpperCase(),
      userId: userId || "anonymous",
      orderId: orderId || null,
      orderTotal: parseFloat(orderTotal),
      discountApplied: parseFloat(discount),
      franchiseId: franchiseId || null,
      locationId: locationId || null,
      redeemedAt: new Date().toISOString()
    });

    console.log(`✅ Recorded promo redemption: ${code} for order: ${orderId}`);

    res.json({
      success: true,
      message: "Promo code redeemed successfully",
      discount: parseFloat(discount)
    });
  } catch (error) {
    console.error("❌ Promo redemption error:", error);
    res.status(500).json({ error: "Failed to record promo redemption" });
  }
});

// GET /api/promo-codes/usage-stats - Usage statistics
// GET /api/promo-codes/usage-stats - Usage statistics
router.get("/usage-stats", async (req, res) => {
  try {
    const { franchiseId, locationId, days = 30 } = req.query;

    let query = db.collection("promoRedemptions");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }

    // Simplified date filtering - remove the date filter for now to test
    // const cutoffDate = new Date();
    // cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    // query = query.where("redeemedAt", ">=", cutoffDate.toISOString());

    const snapshot = await query.get();
    const redemptions = snapshot.docs.map(doc => doc.data());

    // Rest of your code stays the same...
    const usageByCode = {};
    let totalRedemptions = 0;
    let totalSavings = 0;

    redemptions.forEach((r) => {
      const code = r.promoCode;
      if (!usageByCode[code]) {
        usageByCode[code] = {
          count: 0,
          totalSavings: 0,
          lastUsed: null
        };
      }
      usageByCode[code].count++;
      usageByCode[code].totalSavings += r.discountApplied || 0;
      usageByCode[code].lastUsed = r.redeemedAt;

      totalRedemptions++;
      totalSavings += r.discountApplied || 0;
    });

    const topCodes = Object.entries(usageByCode)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.totalSavings - a.totalSavings)
      .slice(0, 5);

    const stats = {
      totalRedemptions,
      totalSavings,
      averageDiscount: totalRedemptions > 0 ? totalSavings / totalRedemptions : 0,
      topCodes
    };

    console.log(`✅ Generated promo usage stats: ${totalRedemptions} redemptions`);
    res.json({ stats, usageByCode });
  } catch (error) {
    console.error("❌ Error generating promo usage stats:", error);
    res.status(500).json({ error: "Failed to generate promo usage statistics" });
  }
});

// POST /api/promo-codes - Legacy route placeholder
router.post("/", async (req, res) => {
  const { code, orderTotal, userId, locationId } = req.body;

  if (!code || !orderTotal || !locationId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    res.status(400).json({
      error: "Please use the new /validate endpoint with promo data from Sanity"
    });
  } catch (error) {
    console.error("Legacy promo code error:", error);
    res.status(500).json({ error: "Something went wrong. Try again later." });
  }
});

module.exports = router;
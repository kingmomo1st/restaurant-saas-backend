const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { db } = require("../firebaseAdmin");

// POST /api/rewards/send-redemption-email
router.post("/send-redemption-email", async (req, res) => {
  const { email, rewardTitle, pointsUsed } = req.body;

  if (!email || !rewardTitle || !pointsUsed) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Your Restaurant Rewards" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "🎁 You've Redeemed a Reward!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2ecc71;">🎉 Congratulations!</h2>
          <p>You have successfully redeemed: <strong>${rewardTitle}</strong></p>
          <p>Points Used: <strong>${pointsUsed}</strong></p>
          <p>Thank you for being a loyal customer! Your reward will be available for pickup/use according to the terms provided.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Redemption email sent to: ${email}`);
    res.status(200).json({
      success: true,
      message: "Redemption email sent successfully",
    });
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    res.status(500).json({ error: "Failed to send redemption email" });
  }
});

// POST /api/rewards/redeem
router.post("/redeem", async (req, res) => {
  const {
    userId,
    userEmail,
    rewardId,
    rewardTitle,
    pointsUsed,
    franchiseId,
    locationId,
  } = req.body;

  if (!userId || !rewardId || !rewardTitle || !pointsUsed) {
    return res
      .status(400)
      .json({ error: "Missing required redemption data" });
  }

  try {
    const redemptionData = {
      userId,
      userEmail: userEmail || null,
      rewardId,
      rewardTitle,
      pointsUsed: parseInt(pointsUsed),
      franchiseId: franchiseId || null,
      locationId: locationId || null,
      redeemedAt: new Date().toISOString(),
      status: "redeemed",
    };

    await db.collection("rewardRedemptions").add(redemptionData);

    console.log(
      `✅ Recorded reward redemption: ${rewardTitle} for user: ${userId}`
    );
    res.json({
      success: true,
      message: "Reward redeemed successfully",
      redemptionData,
    });
  } catch (error) {
    console.error("❌ Reward redemption error:", error);
    res.status(500).json({ error: "Failed to record reward redemption" });
  }
});

// GET /api/rewards/redemption-stats
router.get("/redemption-stats", async (req, res) => {
  try {
    const { franchiseId, locationId, days = 30 } = req.query;

    let query = db.collection("rewardRedemptions");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    query = query.where("redeemedAt", ">=", cutoffDate.toISOString());

    const snapshot = await query.get();
    const redemptions = snapshot.docs.map((doc) => doc.data());

    const redemptionsByReward = {};
    let totalRedemptions = 0;
    let totalPointsRedeemed = 0;

    redemptions.forEach((r) => {
      if (!redemptionsByReward[r.rewardId]) {
        redemptionsByReward[r.rewardId] = {
          count: 0,
          totalPointsUsed: 0,
          lastRedeemed: null,
          title: r.rewardTitle,
        };
      }

      redemptionsByReward[r.rewardId].count++;
      redemptionsByReward[r.rewardId].totalPointsUsed += r.pointsUsed || 0;
      redemptionsByReward[r.rewardId].lastRedeemed = r.redeemedAt;

      totalRedemptions++;
      totalPointsRedeemed += r.pointsUsed || 0;
    });

    const topRewards = Object.entries(redemptionsByReward)
      .map(([rewardId, data]) => ({ rewardId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stats = {
      totalRedemptions,
      totalPointsRedeemed,
      averagePointsPerReward:
        totalRedemptions > 0 ? totalPointsRedeemed / totalRedemptions : 0,
      topRewards,
      uniqueUsers: [...new Set(redemptions.map((r) => r.userId))].length,
    };

    console.log(`✅ Generated reward redemption stats: ${totalRedemptions} redemptions`);
    res.json({ stats, redemptionsByReward });
  } catch (error) {
    console.error("❌ Error generating reward redemption stats:", error);
    res
      .status(500)
      .json({ error: "Failed to generate reward redemption statistics" });
  }
});

// GET /api/rewards/redemptions
router.get("/redemptions", async (req, res) => {
  try {
    const {
      franchiseId,
      locationId,
      userId,
      rewardId,
      startDate,
      endDate,
      sortBy = "redeemedAt",
      sortOrder = "desc",
    } = req.query;

    let query = db.collection("rewardRedemptions");

    if (franchiseId) query = query.where("franchiseId", "==", franchiseId);
    if (locationId) query = query.where("locationId", "==", locationId);
    if (userId) query = query.where("userId", "==", userId);
    if (rewardId) query = query.where("rewardId", "==", rewardId);
    if (startDate) query = query.where("redeemedAt", ">=", startDate);
    if (endDate) query = query.where("redeemedAt", "<=", endDate);

    query = query.orderBy(sortBy, sortOrder).limit(500);

    const snapshot = await query.get();
    const redemptions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${redemptions.length} reward redemptions`);
    res.json(redemptions);
  } catch (error) {
    console.error("❌ Error fetching reward redemptions:", error);
    res.status(500).json({ error: "Failed to fetch reward redemptions" });
  }
});

// PUT /api/rewards/redemptions/:id/status
router.put("/redemptions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updateData = {
      status,
      notes: notes || null,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("rewardRedemptions").doc(id).update(updateData);

    console.log(`✅ Updated redemption status: ${id} to ${status}`);
    res.json({
      success: true,
      message: "Redemption status updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating redemption status:", error);
    res.status(500).json({ error: "Failed to update redemption status" });
  }
});

// DELETE /api/rewards/redemptions/cleanup
router.delete("/redemptions/cleanup", async (req, res) => {
  try {
    const { daysToKeep = 365 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = db
      .collection("rewardRedemptions")
      .where("redeemedAt", "<", cutoffDate.toISOString())
      .limit(500);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        deletedCount: 0,
        message: "No old redemptions to delete",
      });
    }

    const batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();

    console.log(`✅ Cleaned up ${deletedCount} old reward redemptions`);
    res.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} redemption entries older than ${daysToKeep} days`,
    });
  } catch (error) {
    console.error("❌ Error cleaning up reward redemptions:", error);
    res
      .status(500)
      .json({ error: "Failed to clean up reward redemptions" });
  }
});

module.exports = router;
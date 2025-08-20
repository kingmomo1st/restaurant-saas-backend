const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// GET /api/pos/logs - Fetch POS sync logs with filtering
router.get("/logs", async (req, res) => {
  try {
    const {
      franchiseId,
      locationId,
      status,
      startDate,
      endDate,
      sortBy = "syncedAt",
      sortOrder = "desc",
    } = req.query;

    let query = db.collection("posSyncLogs");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    if (status && status !== "All") {
      query = query.where("status", "==", status);
    }
    if (startDate) {
      query = query.where("syncedAt", ">=", startDate);
    }
    if (endDate) {
      query = query.where("syncedAt", "<=", endDate);
    }

    query = query.orderBy(sortBy, sortOrder);

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${logs.length} POS sync logs`);
    res.json(logs);
  } catch (error) {
    console.error("❌ Error fetching POS logs:", error);
    res.status(500).json({ error: "Failed to fetch POS sync logs" });
  }
});

// POST /api/pos/sync-order - Sync order to POS system
router.post("/sync-order", async (req, res) => {
  try {
    const { orderId, items, total, userEmail, franchiseId, locationId } = req.body;

    if (!orderId || !items || !total) {
      return res.status(400).json({ error: "Missing required order data" });
    }

    console.log("🔄 Attempting POS Sync:", { orderId, items, total, userEmail });

    const success = await simulatePOSSync({ orderId, items, total, userEmail });

    const logData = {
      orderId,
      items,
      total: parseFloat(total),
      userEmail: userEmail || "Unknown",
      franchiseId: franchiseId || null,
      locationId: locationId || null,
      status: success ? "success" : "failed",
      syncedAt: new Date().toISOString(),
      retryCount: 0,
      lastRetryAt: null,
      errorMessage: success ? null : "Simulated POS sync failure",
      posResponse: success ? { transactionId: `POS_${Date.now()}` } : null,
    };

    await db.collection("posSyncLogs").add(logData);

    if (success) {
      console.log("✅ POS Sync successful for order:", orderId);
      res.status(200).json({
        success: true,
        message: "Order synced to POS successfully",
        transactionId: logData.posResponse.transactionId,
      });
    } else {
      console.log("❌ POS Sync failed for order:", orderId);
      res.status(500).json({
        success: false,
        message: "POS sync failed - logged for retry",
      });
    }
  } catch (err) {
    console.error("❌ POS Sync error:", err.message);

    try {
      await db.collection("posSyncLogs").add({
        orderId: req.body.orderId || "unknown",
        status: "failed",
        errorMessage: err.message,
        syncedAt: new Date().toISOString(),
        retryCount: 0,
      });
    } catch (logError) {
      console.error("Failed to log POS sync error:", logError);
    }

    res.status(500).json({ success: false, message: "POS sync failed" });
  }
});

// POST /api/pos/retry-sync - Retry failed POS sync
router.post("/retry-sync", async (req, res) => {
  try {
    const { logId } = req.body;

    if (!logId) {
      return res.status(400).json({ error: "Log ID is required" });
    }

    const logDoc = await db.collection("posSyncLogs").doc(logId).get();

    if (!logDoc.exists) {
      return res.status(404).json({ error: "Sync log not found" });
    }

    const logData = logDoc.data();

    console.log("🔄 Retrying POS Sync for order:", logData.orderId);

    const success = await simulatePOSSync({
      orderId: logData.orderId,
      items: logData.items,
      total: logData.total,
      userEmail: logData.userEmail,
    });

    await db.collection("posSyncLogs").doc(logId).update({
      status: success ? "success" : "failed",
      retryCount: (logData.retryCount || 0) + 1,
      lastRetryAt: new Date().toISOString(),
      errorMessage: success ? null : "Retry failed - simulated POS error",
      posResponse: success
        ? { transactionId: `POS_RETRY_${Date.now()}` }
        : logData.posResponse,
    });

    if (success) {
      console.log("✅ POS Retry successful for order:", logData.orderId);
      res.json({
        success: true,
        message: "Retry successful - order synced to POS",
      });
    } else {
      console.log("❌ POS Retry failed for order:", logData.orderId);
      res.status(500).json({
        success: false,
        message: "Retry failed - POS sync unsuccessful",
      });
    }
  } catch (error) {
    console.error("❌ Error retrying POS sync:", error);
    res.status(500).json({ error: "Failed to retry POS sync" });
  }
});

// GET /api/pos/stats - Get POS sync statistics
router.get("/stats", async (req, res) => {
  try {
    const { franchiseId, locationId, days = 30 } = req.query;

    let query = db.collection("posSyncLogs");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    query = query.where("syncedAt", ">=", cutoffDate.toISOString());

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc) => doc.data());

    const stats = {
      totalSyncs: logs.length,
      successfulSyncs: logs.filter((log) => log.status === "success").length,
      failedSyncs: logs.filter((log) => log.status === "failed").length,
      successRate:
        logs.length > 0
          ? (
              (logs.filter((log) => log.status === "success").length / logs.length) *
              100
            ).toFixed(1)
          : 0,
      totalRevenue: logs
        .filter((log) => log.status === "success")
        .reduce((sum, log) => sum + (log.total || 0), 0),
      averageOrderValue:
        logs.length > 0
          ? (
              logs.reduce((sum, log) => sum + (log.total || 0), 0) / logs.length
            ).toFixed(2)
          : 0,
      retryCount: logs.reduce((sum, log) => sum + (log.retryCount || 0), 0),
      recentFailures: logs
        .filter((log) => log.status === "failed")
        .sort((a, b) => new Date(b.syncedAt) - new Date(a.syncedAt))
        .slice(0, 5)
        .map((log) => ({
          orderId: log.orderId,
          userEmail: log.userEmail,
          total: log.total,
          errorMessage: log.errorMessage,
          syncedAt: log.syncedAt,
        })),
    };

    console.log(`✅ Generated POS stats: ${stats.totalSyncs} syncs in last ${days} days`);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error generating POS stats:", error);
    res.status(500).json({ error: "Failed to generate POS statistics" });
  }
});

// DELETE /api/pos/logs/cleanup - Clean up old POS logs
router.delete("/logs/cleanup", async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = db
      .collection("posSyncLogs")
      .where("syncedAt", "<", cutoffDate.toISOString())
      .limit(500);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        deletedCount: 0,
        message: "No old logs to delete",
      });
    }

    const batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();

    console.log(`✅ Cleaned up ${deletedCount} old POS logs`);
    res.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} log entries older than ${daysToKeep} days`,
    });
  } catch (error) {
    console.error("❌ Error cleaning up POS logs:", error);
    res.status(500).json({ error: "Failed to clean up POS logs" });
  }
});

// Simulate POS integration (replace with real POS API)
async function simulatePOSSync(orderData) {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
  return Math.random() < 0.85;
}

module.exports = router;
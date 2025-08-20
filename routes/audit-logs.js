const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// GET /api/audit-logs - Fetch all audit logs with filtering
router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId, action, actor, startDate, endDate } = req.query;

    let query = db.collection("auditLogs");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    if (action && action !== "All") {
      query = query.where("action", "==", action);
    }
    if (actor && actor !== "All") {
      query = query.where("actor", "==", actor);
    }
    if (startDate) {
      query = query.where("timestamp", ">=", startDate);
    }
    if (endDate) {
      query = query.where("timestamp", "<=", endDate);
    }

    query = query.orderBy("timestamp", "desc").limit(1000);

    const snapshot = await query.get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${logs.length} audit logs`);
    res.json(logs);
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// POST /api/audit-logs - Create a new audit log entry
router.post("/", async (req, res) => {
  try {
    const logData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (!logData.action || !logData.description) {
      return res.status(400).json({ error: "Action and description are required" });
    }

    const docRef = await db.collection("auditLogs").add(logData);

    console.log(`✅ Created audit log: ${docRef.id} - ${logData.action}`);
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Audit log created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating audit log:", error);
    res.status(500).json({ error: "Failed to create audit log" });
  }
});

// DELETE /api/audit-logs/cleanup - Clean up old audit logs
router.delete("/cleanup", async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISOString = cutoffDate.toISOString();

    console.log(`🧹 Cleaning up audit logs older than ${daysToKeep} days (before ${cutoffISOString})`);

    const oldLogsQuery = db
      .collection("auditLogs")
      .where("timestamp", "<", cutoffISOString)
      .limit(500);

    const snapshot = await oldLogsQuery.get();

    if (snapshot.empty) {
      console.log("✅ No old logs to delete");
      return res.json({ success: true, deletedCount: 0, message: "No old logs found" });
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    console.log(`✅ Deleted ${snapshot.size} old audit logs`);
    res.json({
      success: true,
      deletedCount: snapshot.size,
      message: `Deleted ${snapshot.size} old audit log entries`,
    });
  } catch (error) {
    console.error("❌ Error cleaning up audit logs:", error);
    res.status(500).json({ error: "Failed to clean up audit logs" });
  }
});

// GET /api/audit-logs/stats - Get audit log statistics
router.get("/stats", async (req, res) => {
  try {
    const { franchiseId, locationId } = req.query;

    let query = db.collection("auditLogs");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => doc.data());

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: logs.length,
      today: logs.filter(log => new Date(log.timestamp) >= today).length,
      thisWeek: logs.filter(log => new Date(log.timestamp) >= weekAgo).length,
      errors: logs.filter(
        log =>
          log.action?.includes("ERROR") ||
          log.action?.includes("FAILED") ||
          log.action?.includes("DENIED")
      ).length,
      byAction: {},
      byActor: {},
    };

    logs.forEach(log => {
      const action = log.action || "UNKNOWN";
      stats.byAction[action] = (stats.byAction[action] || 0) + 1;
    });

    logs.forEach(log => {
      const actor = log.actor || "System";
      stats.byActor[actor] = (stats.byActor[actor] || 0) + 1;
    });

    console.log(`✅ Generated audit log stats: ${stats.total} total logs`);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error generating audit log stats:", error);
    res.status(500).json({ error: "Failed to generate audit log statistics" });
  }
});

module.exports = router;
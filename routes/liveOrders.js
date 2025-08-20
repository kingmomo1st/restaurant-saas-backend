const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");

// GET /api/live-orders - Get recent orders for live monitoring
router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId, status } = req.query;

    // 🔥 CHANGE: Show orders from last 7 days instead of 24 hours for live view
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days instead of 1 day

    console.log(`🔍 Live orders cutoff date: ${cutoffDate.toISOString()}`);

    let query = db
      .collection("orders")
      .where("createdAt", ">=", cutoffDate)
      .orderBy("createdAt", "desc")
      .limit(100); // Keep limit for performance

    // Apply filters carefully to avoid compound index issues
    if (franchiseId && franchiseId !== "undefined") {
      console.log(`🔍 Filtering by franchiseId: ${franchiseId}`);
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId && locationId !== "undefined") {
      console.log(`🔍 Filtering by locationId: ${locationId}`);
      query = query.where("locationId", "==", locationId);
    }

    const snapshot = await query.get();
    console.log(`🔍 Live orders raw query returned: ${snapshot.size} documents`);

    let orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Enhanced customer name detection
        customerName:
          data.customerName ||
          (data.customerInfo?.firstName
            ? `${data.customerInfo.firstName} ${data.customerInfo.lastName || ""}`.trim()
            : "Anonymous"),
        // Ensure we have a total
        total: data.total || data.finalTotal || data.originalTotal || 0,
      };
    });

    // 🔥 FILTER BY STATUS AFTER QUERY (to avoid compound index issues)
    if (status && status !== "All") {
      orders = orders.filter((order) => order.status === status);
      console.log(`🔍 After status filter (${status}): ${orders.length} orders`);
    }

    // 🔥 DEBUG: Check for your test order specifically
    const testOrder = orders.find(
      (order) =>
        order.customerInfo?.firstName === "momotest1234" ||
        order.customerInfo?.phone === "5103285550"
    );

    if (testOrder) {
      console.log("🎯 FOUND TEST ORDER in live orders:", {
        id: testOrder.id,
        status: testOrder.status,
        customerName: testOrder.customerName,
        createdAt: testOrder.createdAt,
        total: testOrder.total,
      });
    } else {
      console.log("❌ Test order NOT found in live orders");
      // Show what we do have
      console.log(
        "🔍 Live orders sample:",
        orders.slice(0, 3).map((o) => ({
          id: o.id,
          customer: o.customerName,
          status: o.status,
          createdAt: o.createdAt,
        }))
      );
    }

    console.log(`✅ Live orders fetched: ${orders.length} recent orders`);
    res.json(orders);
  } catch (err) {
    console.error("❌ Error fetching live orders:", err);

    // 🔥 ENHANCED ERROR HANDLING: Try fallback query without date filter
    try {
      console.log("🔄 Attempting fallback query without date filter...");

      let fallbackQuery = db.collection("orders").orderBy("createdAt", "desc").limit(50);

      const fallbackSnapshot = await fallbackQuery.get();
      const fallbackOrders = fallbackSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        customerName: doc.data().customerName || "Anonymous",
        total: doc.data().total || doc.data().finalTotal || 0,
      }));

      console.log(`🔄 Fallback query returned: ${fallbackOrders.length} orders`);
      res.json(fallbackOrders);
    } catch (fallbackErr) {
      console.error("❌ Fallback query also failed:", fallbackErr);
      res.status(500).json({
        error: "Failed to fetch live orders",
        details: err.message,
        fallbackError: fallbackErr.message,
      });
    }
  }
});

// PUT /api/live-orders/:id - Update order status
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    console.log(`🔄 Updating order ${id} status to: ${status}`);

    await db.collection("orders").doc(id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Live order status updated: ${id} -> ${status}`);
    res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("❌ Error updating live order:", err);
    res.status(500).json({ error: "Update failed", details: err.message });
  }
});

module.exports = router;
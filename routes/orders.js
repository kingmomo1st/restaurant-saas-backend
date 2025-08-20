const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// GET /api/orders - Fetch all orders with filtering
router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId, status, orderType, customerType } = req.query;

    let query = db.collection("orders");

    // Apply filters
    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    if (status && status !== "All") {
      query = query.where("status", "==", status);
    }
    if (orderType && orderType !== "All") {
      query = query.where("orderType", "==", orderType);
    }
    if (customerType && customerType !== "All") {
      query = query.where("customerType", "==", customerType);
    }

    // Order by creation date descending
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Fetched ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PUT /api/orders/:id - Update an order
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    updateData.updatedAt = new Date().toISOString();

    await db.collection("orders").doc(id).update(updateData);

    console.log(`✅ Updated order: ${id}`);
    res.json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// DELETE /api/orders/:id - Delete an order
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("orders").doc(id).delete();

    console.log(`✅ Deleted order: ${id}`);
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

module.exports = router;
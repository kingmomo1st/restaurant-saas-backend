const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// GET /api/events - Fetch all events with filtering
router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId, status, eventType, visibleOnHomepage } = req.query;

    let query = db.collection("events");

    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    if (status && status !== "All") {
      query = query.where("status", "==", status);
    }
    if (eventType && eventType !== "All") {
      query = query.where("eventType", "==", eventType);
    }
    if (visibleOnHomepage === "true") {
      query = query.where("visibleOnHomepage", "==", true);
    }

    query = query.orderBy("date", "desc");

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /api/events - Create a new event
router.post("/", async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!eventData.title || !eventData.date) {
      return res.status(400).json({ error: "Title and date are required" });
    }

    const docRef = await db.collection("events").add(eventData);

    console.log(`✅ Created event: ${docRef.id}`);
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// PUT /api/events/:id - Update an event
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    if (!updateData.title || !updateData.date) {
      return res.status(400).json({ error: "Title and date are required" });
    }

    await db.collection("events").doc(id).update(updateData);

    console.log(`✅ Updated event: ${id}`);
    res.json({ success: true, message: "Event updated successfully" });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE /api/events/:id - Delete an event
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("events").doc(id).delete();

    console.log(`✅ Deleted event: ${id}`);
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

module.exports = router;
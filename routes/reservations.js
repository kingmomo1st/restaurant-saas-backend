const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");
const { sendReservationConfirmationEmail } = require("../services/emailService");

// GET /api/reservations - Fetch all reservations with filtering
router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId, status, dateFilter } = req.query;

    let query = db.collection("reservations");

    // Firestore filters
    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    if (status && status !== "All") {
      query = query.where("status", "==", status);
    }

    // Always order by createdAt descending
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let reservations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side date filtering
    if (dateFilter && dateFilter !== "All") {
      const now = new Date();
      reservations = reservations.filter((r) => {
        const resDate = new Date(r.date);
        if (dateFilter === "Upcoming") return resDate >= now;
        if (dateFilter === "Past") return resDate < now;
        return true;
      });
    }

    console.log(`✅ Fetched ${reservations.length} reservations`);
    res.json(reservations);
  } catch (error) {
    console.error("❌ Error fetching reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

// POST /api/reservations - Create new reservation
router.post("/", async (req, res) => {
  try {
    console.log("🎯 POST /api/reservations hit with data:", req.body);

    const reservationData = req.body;

    // 🔥 Convert ISO date string to Firestore Timestamp
    if (reservationData.date) {
      reservationData.date = admin.firestore.Timestamp.fromDate(
        new Date(reservationData.date)
      );
    }

    // Add server timestamp and default values
    reservationData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    reservationData.status = reservationData.status || "confirmed";
    reservationData.franchiseId = reservationData.franchiseId || "fallback1";

    console.log("🎯 Saving reservation data:", reservationData);

    const docRef = await db.collection("reservations").add(reservationData);

    // 📧 Send confirmation email
    
try {
  if (reservationData.email) {
    console.log("📧 Sending reservation confirmation email...");

    // Create email data - map your data fields correctly
    const emailData = {
      to: reservationData.email,
      customerName: reservationData.name, // Use 'name' field from your data
      partySize: reservationData.guests, // Use 'guests' field from your data
      date: reservationData.date.toDate(), // Convert Firestore timestamp back to Date
      time: reservationData.time,
      location: reservationData.locationName || "Our Restaurant",
      reservationId: docRef.id,
      locationId: reservationData.locationId || reservationData.franchiseId || null
      
    };

    await sendReservationConfirmationEmail(emailData);
    console.log("✅ Reservation confirmation email sent");
  }
} catch (emailError) {
  console.error("❌ Failed to send reservation email:", emailError);
  // Don't fail the reservation if email fails
}

    console.log(`✅ Created reservation: ${docRef.id}`);
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Reservation created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating reservation:", error);
    console.error("❌ Full error details:", error.message, error.stack);
    res.status(500).json({
      error: "Failed to create reservation",
      details: error.message,
    });
  }
});

// PUT /api/reservations/:id - Update a reservation
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    updateData.updatedAt = new Date().toISOString();

    await db.collection("reservations").doc(id).update(updateData);

    console.log(`✅ Updated reservation: ${id}`);
    res.json({ success: true, message: "Reservation updated successfully" });
  } catch (error) {
    console.error("❌ Error updating reservation:", error);
    res.status(500).json({ error: "Failed to update reservation" });
  }
});

// DELETE /api/reservations/:id - Delete a reservation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("reservations").doc(id).delete();

    console.log(`✅ Deleted reservation: ${id}`);
    res.json({ success: true, message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting reservation:", error);
    res.status(500).json({ error: "Failed to delete reservation" });
  }
});

module.exports = router;
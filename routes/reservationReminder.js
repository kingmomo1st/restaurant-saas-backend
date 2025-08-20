const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin"); 
const { sendReservationConfirmationEmail } = require("../services/emailService.js"); // 🔥 Use existing function

router.post("/check-reservation-reminders", async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const snapshot = await db.collection("reservations").get(); // 🔥 FIX: Use Firestore syntax

    const emailsSent = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const reservationDate = data.date.toDate ? data.date.toDate() : new Date(data.date); // Handle Firestore timestamp
      const isToday = reservationDate.toISOString().startsWith(today);
      const isPast = reservationDate < now;

      const shouldSend =
        data.email &&
        (isToday || isPast) &&
        !data.reminderSent;

      if (shouldSend) {
        // 🔥 UPDATED: Use the CMS-enabled confirmation email function
        await sendReservationConfirmationEmail({
          to: data.email,
          customerName: data.name, // 🔥 CHANGED: Use 'customerName'
          partySize: data.guests,
          date: reservationDate,
          time: data.time,
          location: data.locationName || "Our Restaurant",
          reservationId: docSnap.id,
          locationId: data.locationId || data.franchiseId || null // 🔥 ADD THIS
        });

        // 🔥 FIX: Use Firestore syntax
        await db.collection("reservations").doc(docSnap.id).update({
          reminderSent: true,
        });

        await db.collection("logActions").add({
          timestamp: new Date(),
          action: "Reservation Reminder Email",
          description: `Reminder/thank you sent to ${data.email}`,
          actor: "System",
          franchiseId: data.franchiseId || null,
          franchiseName: data.franchiseName || null,
          locationId: data.locationId || null,
          locationName: data.locationName || null,
        });

        emailsSent.push(data.email);
      }
    }

    res.status(200).json({
      success: true,
      message: `Reservation emails sent to ${emailsSent.length} user(s).`,
      emails: emailsSent,
    });
  } catch (err) {
    console.error("Error sending reservation reminders:", err);
    res.status(500).json({ success: false, message: "Failed to send reservation reminders." });
  }
});

module.exports = router;
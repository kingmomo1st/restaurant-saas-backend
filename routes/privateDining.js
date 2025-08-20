const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin");
const { sendPrivateDiningConfirmationEmail } = require("../services/emailService");

// GET /api/private-dining - Fetch all private dining requests with filtering
router.get("/", async (req, res) => {
  try {
    const { franchiseId, locationId, status } = req.query;

    let query = db.collection("privateDining");

    // Apply Firestore filters
    if (franchiseId) {
      query = query.where("franchiseId", "==", franchiseId);
    }
    if (locationId) {
      query = query.where("locationId", "==", locationId);
    }
    if (status && status !== "All") {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();

    const privateDiningRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${privateDiningRequests.length} private dining requests`);
    res.json(privateDiningRequests);
  } catch (error) {
    console.error("❌ Error fetching private dining requests:", error);
    res.status(500).json({ error: "Failed to fetch private dining requests" });
  }
});

// POST /api/private-dining - Create new private dining request
router.post("/", async (req, res) => {
  try {
    console.log("🥂 Creating private dining request:", req.body);

    const privateDiningData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: req.body.status || "pending",
      franchiseId: req.body.franchiseId || "fallback1",
    };

    // Save to Firestore
    const docRef = await db.collection("privateDining").add(privateDiningData);
    console.log(`✅ Saved to Firestore: ${docRef.id}`);

    // Send confirmation email
    try {
      if (privateDiningData.email) {
        console.log("📧 Sending private dining confirmation email...");

        await sendPrivateDiningConfirmationEmail({
          to: privateDiningData.email,
          requesterName: privateDiningData.requesterName || privateDiningData.name,
          partySize: privateDiningData.partySize || privateDiningData.guests,
          date: privateDiningData.date,
          eventNature: privateDiningData.eventNature || "Private Event",
          locationId: privateDiningData.locationId || privateDiningData.franchiseId || null,
          
        });

        console.log("✅ Private dining email sent successfully!");
      }
    } catch (emailError) {
      console.error("❌ Email failed (continuing anyway):", emailError.message);
    }

    // Optional Sanity sync
    try {
      const sanityWriteClient = require("../sanityClient");
      await sanityWriteClient.create({
        _type: "privateDiningEntry",
        name: privateDiningData.requesterName || privateDiningData.name,
        email: privateDiningData.email,
        phone: privateDiningData.phone,
        guests: privateDiningData.partySize || privateDiningData.guests,
        date: privateDiningData.date,
        eventNature: privateDiningData.eventNature,
        notes: privateDiningData.notes || "",
        status: privateDiningData.status,
        firestoreId: docRef.id,
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Synced to Sanity (optional)");
    } catch (sanityError) {
      console.log("⚠️ Sanity sync failed (non-critical):", sanityError.message);
    }

    res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Private dining request submitted successfully",
    });
  } catch (error) {
    console.error("❌ Error creating private dining request:", error);
    res.status(500).json({
      error: "Failed to create private dining request",
      details: error.message,
    });
  }
});

// PUT /api/private-dining/:id - Update a private dining request
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("privateDining").doc(id).update(updateData);

    console.log(`✅ Updated private dining request: ${id}`);
    res.json({ success: true, message: "Private dining request updated successfully" });
  } catch (error) {
    console.error("❌ Error updating private dining request:", error);
    res.status(500).json({ error: "Failed to update private dining request" });
  }
});

// DELETE /api/private-dining/:id - Delete a private dining request
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("privateDining").doc(id).delete();

    console.log(`✅ Deleted private dining request: ${id}`);
    res.json({ success: true, message: "Private dining request deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting private dining request:", error);
    res.status(500).json({ error: "Failed to delete private dining request" });
  }
});

module.exports = router;
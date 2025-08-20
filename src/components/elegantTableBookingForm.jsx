import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "./css/ElegantTableBookingForm.css";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => {
  try {
    return source ? builder.image(source).url() : null;
  } catch (error) {
    console.warn("Error building image URL:", error);
    return null;
  }
};

// ✅ Robust 12h -> 24h converter (prevents padStart crash)
const convertTo24Hour = (time12h) => {
  if (!time12h) return "";
  // Already 24h? return normalized HH:MM
  if (!/\s?(AM|PM)$/i.test(time12h)) {
    const [h = "00", m = "00"] = String(time12h).split(":");
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const [time, rawMod] = time12h.trim().split(/\s+/);
  let [hours, minutes] = time.split(":");
  const modifier = rawMod.toUpperCase();

  let h = parseInt(hours, 10);
  if (modifier === "AM") {
    if (h === 12) h = 0;          // 12:xx AM -> 00:xx
  } else {
    if (h !== 12) h += 12;        // 1-11 PM -> +12; 12 PM stays 12
  }
  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// 🔥 FIXED: Simplified Sanity query with better error handling
const fetchBookingData = async (locationId) => {
  try {
    console.log("🔍 Fetching with locationId:", locationId);

    // Try a simpler query first
    const pageData = await sanityClient.fetch(`
      *[_type == "tableBookingPage"][0]{
        wallpaperImage,
        heading,
        subtext,
        successMessage,
        errorMessages,
        formFieldLabels,
        timeSlots,
        maxBookingsPerSlot,
        advanceBookingDays
      }
    `);

    console.log("📊 Raw Sanity Data:", pageData);

    if (!pageData) {
      console.warn("⚠️ No tableBookingPage found in Sanity");
      return {
        heading: "Book your Table",
        subtext: "",
        timeSlots: ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"],
        maxBookingsPerSlot: 5,
        advanceBookingDays: 30
      };
    }

    return {
      wallpaper: pageData?.wallpaperImage ? urlFor(pageData.wallpaperImage) : null,
      heading: pageData?.heading || "Book your Table",
      subtext: pageData?.subtext || "",
      successMessage: pageData?.successMessage || "Reservation confirmed! Redirecting…",
      errorMessages: pageData?.errorMessages || {},
      labels: pageData?.formFieldLabels || {},
      timeSlots: pageData?.timeSlots || ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"],
      maxBookingsPerSlot: pageData?.maxBookingsPerSlot || 5,
      advanceBookingDays: pageData?.advanceBookingDays || 30
    };

  } catch (err) {
    console.error("❌ Sanity fetch error:", err);
    throw err;
  }
};

const ElegantTableBookingForm = () => {
  const navigate = useNavigate();
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  // Existing state
  const [wallpaper, setWallpaper] = useState(null);
  const [heading, setHeading] = useState("Book your Table");
  const [subtext, setSubtext] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessages, setErrorMessages] = useState({});
  const [labels, setLabels] = useState({});

  // 🔥 NEW: CMS Settings state
  const [timeSlots, setTimeSlots] = useState([]);
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState(5);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);

  // 🔥 NEW: Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: 1,
    date: "",
    time: "",
  });

  // 🔍 DEBUG: Component state tracking
  useEffect(() => {
    console.log("🔍 Component state:", {
      wallpaper,
      selectedLocation,
      timeSlots,
      formData,
      loading,
      error
    });
  }, [wallpaper, selectedLocation, timeSlots, formData, loading, error]);

  // 🔥 FIXED: Better error handling for data fetching
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Selected Location:", selectedLocation);

        const data = await fetchBookingData(selectedLocation?._id);

        console.log("📊 Fetched Data:", data);

        // Set page content
        if (data.wallpaper) setWallpaper(data.wallpaper);
        setHeading(data.heading);
        setSubtext(data.subtext);
        setSuccessMessage(data.successMessage);
        setErrorMessages(data.errorMessages);
        setLabels(data.labels);

        // Set CMS settings
        setTimeSlots(data.timeSlots);
        setMaxBookingsPerSlot(data.maxBookingsPerSlot);
        setAdvanceBookingDays(data.advanceBookingDays);

      } catch (err) {
        console.error("❌ Error loading booking data:", err);
        setError(err.message);

        // Set fallback values
        setTimeSlots(["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"]);
        setMaxBookingsPerSlot(5);
        setAdvanceBookingDays(30);

      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [selectedLocation]);

  // NEW useEffect for full-page wallpaper
useEffect(() => {
  if (wallpaper) {
    // Apply to body for true full-page coverage
    document.body.style.backgroundImage = `url(${wallpaper})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  }
  
  return () => {
    // Clean up when leaving page
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
  };
}, [wallpaper]);

  // 🔥 UPDATED: Calculate max date based on CMS setting
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceBookingDays);
    return maxDate;
  };

  // 🔥 UPDATED: Convert time slots from CMS to options format
  const getTimeOptions = () => {
    return timeSlots.map((slot) => ({
      value: convertTo24Hour(slot),
      label: slot
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  // 🔥 FIXED: Complete handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessText("");
    setErrorText("");

    const { name, email, phone, guests, date, time } = formData;

    // Validation
    if (!selectedLocation) {
      setErrorText("Please select a restaurant location first.");
      setIsSubmitting(false);
      return;
    }

    if (!name || !email || !phone || !guests || !date || !time) {
      setErrorText("All fields are required.");
      setIsSubmitting(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorText(errorMessages?.invalidEmail || "Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setErrorText("Please enter a valid 10-digit phone number.");
      setIsSubmitting(false);
      return;
    }

    // 🔥 NEW: Check advance booking limit
    const selectedDate = new Date(date);
    const today = new Date();
    const daysDifference = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));

    if (daysDifference > advanceBookingDays) {
      setErrorText(`Reservations can only be made up to ${advanceBookingDays} days in advance.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const reservationData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        guests: parseInt(guests),
        time: time,
        date: date.toISOString(),
        locationId: selectedLocation._id,
        status: "confirmed",
        maxBookingsPerSlot,
        timeSlot: timeSlots.find((slot) => convertTo24Hour(slot) === time)
      };

      console.log("🎯 Submitting reservation:", reservationData);

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.details || responseData.error || "Failed to submit");
      }

      setFormData({ name: "", email: "", phone: "", guests: 1, date: "", time: "" });
      setSuccessText(successMessage || "Reservation confirmed! Redirecting...");
      setTimeout(() => navigate("/"), 2500);

    } catch (err) {
      console.error("Error submitting reservation:", err);
      setErrorText(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="elegant-table-booking-form" style={{
        textAlign: "center", padding: "50px", minHeight: "100vh",
        backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div>
          <h2>Loading booking form…</h2>
          <div style={{ marginTop: "20px" }}>
            <div style={{
              border: "4px solid #f3f3f3", borderTop: "4px solid #3498db",
              borderRadius: "50%", width: "40px", height: "40px",
              animation: "spin 2s linear infinite", margin: "0 auto"
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="elegant-table-booking-form" style={{
        textAlign: "center", padding: "50px", minHeight: "100vh",
        backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div>
          <h2 style={{ color: "#e74c3c" }}>Error loading form</h2>
          <p style={{ color: "#7f8c8d", margin: "20px 0" }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            backgroundColor: "#3498db", color: "white", border: "none",
            padding: "10px 20px", borderRadius: "5px", cursor: "pointer"
          }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="elegant-table-booking-form">
      <h2 className="form-title">{heading}</h2>
      {subtext && <p className="form-subtext">{subtext}</p>}

      <div className="booking-info" style={{
        backgroundColor: "rgba(255,255,255,0.9)", padding: "10px",
        borderRadius: "6px", margin: "10px 0", fontSize: "14px", textAlign: "center"
      }}>
        <p>📅 Reservations available up to {advanceBookingDays} days in advance</p>
        <p>👥 Maximum {maxBookingsPerSlot} reservations per time slot</p>
      </div>

      {!selectedLocation ? (
        <p className="error-message" style={{ textAlign: "center", color: "#b03a2e" }}>
          Please select a restaurant location first.
        </p>
      ) : (
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="form-left">
            <label>{labels?.nameLabel || "Name:"}</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />

            <label>{labels?.emailLabel || "Email:"}</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />

            <label>{labels?.phoneLabel || "Phone:"}</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />

            <label>{labels?.guestsLabel || "Guests:"}</label>
            <input type="number" name="guests" value={formData.guests} min="1" max="20" onChange={handleChange} required />

            <label>{labels?.dateLabel || "Date:"}</label>
            <DatePicker selected={formData.date} onChange={handleDateChange} minDate={new Date()} maxDate={getMaxDate()} dateFormat="yyyy-MM-dd" required />
          </div>

          <div className="form-right">
            <label>{labels?.timeLabel || "Time:"}</label>
            <select name="time" value={formData.time} onChange={handleChange} required>
              <option value="">Select time</option>
              {getTimeOptions().map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? "Booking..." : "Book Now"}
            </button>
          </div>
        </form>
      )}

      {successText && <p className="success-message">{successText}</p>}
      {errorText && <p className="error-message">{errorText}</p>}

      <div className="back-home-link">
        <button className="btn" onClick={() => navigate("/")}>← Back to Home</button>
      </div>
    </div>
  );
};

export default ElegantTableBookingForm;
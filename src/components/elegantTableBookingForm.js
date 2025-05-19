import React, { useState } from "react";
import { firestore as db } from "../firebase";
import { collection, Timestamp, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { MAX_BOOKING_PER_SLOT, TIME_OPTIONS } from "./constant";
import DatePicker from "react-datepicker";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "./css/ElegantTableBookingForm.css";

const ElegantTableBookingForm = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", guests: 1, date: "", time: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [disabledTimes, setDisabledTimes] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const { name, email, phone, guests, date, time } = formData;

    if (!name || !email || !phone || !guests || !date || !time) {
      setErrorMessage("All fields are required");
      setIsSubmitting(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setErrorMessage("Please enter a valid phone number");
      setIsSubmitting(false);
      return;
    }

    try {
      const timestamp = Timestamp.fromDate(new Date(date));
      const reservationsRef = collection(db, "reservations");

      const existingBookingQuery = query(reservationsRef, where("date", "==", timestamp), where("email", "==", email.trim()));
      const existingSnapshot = await getDocs(existingBookingQuery);
      if (!existingSnapshot.empty) {
        setErrorMessage("You already have a reservation booked");
        setIsSubmitting(false);
        return;
      }

      const timeSlotQuery = query(reservationsRef, where("date", "==", timestamp), where("time", "==", time));
      const slotSnapshot = await getDocs(timeSlotQuery);
      if (slotSnapshot.size >= MAX_BOOKING_PER_SLOT) {
        setErrorMessage("This time slot is fully booked. Please try another one");
        setIsSubmitting(false);
        return;
      }

      const trimmedData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        guests,
        time,
        date: timestamp,
        createdAt: serverTimestamp(),
      };

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedData),
      });

      if (!res.ok) throw new Error("Failed to submit");

      /*
      await sendConfirmationEmail(trimmedData.email);
      */

      
      setFormData({ name: "", email: "", phone: "", guests: 1, date: "", time: "" });
      setSuccessMessage("Reservation confirmed! Redirecting...");
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="elegant-table-booking-form">
      <h2 className="form-title">Book your Table</h2>

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-left">
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />

          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />

          <label>Phone:</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />

          <label>Guests:</label>
          <input type="number" name="guests" value={formData.guests} min="1" max="20" onChange={handleChange} required />

          <label>Date:</label>
          <DatePicker selected={formData.date} onChange={handleDateChange} minDate={new Date()} dateFormat="yyyy-MM-dd" required />
        </div>

        <div className="form-right">
          <label>Time:</label>
          <select name="time" value={formData.time} onChange={handleChange} required>
            <option value="">Select time</option>
            {TIME_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? "Booking..." : "Book Now"}
          </button>
        </div>
      </form>

      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="back-home-link">
        <button className="btn" onClick={() => navigate("/")}>← Back to Home</button>
      </div>
    </div>
  );
};

export default ElegantTableBookingForm;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/PrivateDiningForm.css";

const PrivateDiningForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', date: '', time: '', guests: '',
    occasion: '', eventDuration: '', eventNature: '', additionalDetails: '', referral: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        ...formData,
        date: new Date(`${formData.date}T${formData.time}`),
      };

      const response = await fetch("/api/private-dining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error("Submission failed");

      alert("Private dining inquiry submitted!");
      setFormData({
        name: '', email: '', phone: '', date: '', time: '', guests: '',
        occasion: '', eventDuration: '', eventNature: '', additionalDetails: '', referral: '',
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="private-dining-form-container">
      <h2>Private Inquiry</h2>
      <form onSubmit={handleSubmit}>
        {[
          { label: "Name", name: "name" },
          { label: "Email", name: "email", type: "email" },
          { label: "Phone", name: "phone", type: "tel" },
          { label: "Date", name: "date", type: "date" },
          { label: "Time", name: "time", type: "time" },
          { label: "Guests", name: "guests", type: "number" },
          { label: "Occasion", name: "occasion" },
          { label: "Duration", name: "eventDuration" },
          { label: "Nature of Event", name: "eventNature" },
          { label: "Referral Source", name: "referral" },
        ].map(({ label, name, type = "text" }) => (
          <div className="form-group" key={name}>
            <label>{label}</label>
            <input type={type} name={name} value={formData[name]} onChange={handleChange} required />
          </div>
        ))}

        <div className="form-group">
          <label>Additional Details</label>
          <textarea
            name="additionalDetails"
            value={formData.additionalDetails}
            onChange={handleChange}
            placeholder="Let us know anything important about your event..."
          />
        </div>

        <button type="submit" className="btn-submit">Submit Inquiry</button>
      </form>

      <button className="back-home-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>
    </div>
  );
};

export default PrivateDiningForm;
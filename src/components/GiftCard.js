import React, { useState } from "react";
import "./css/GiftCard.css";

const GiftCard = () => {
  const [formData, setFormData] = useState({
    senderName: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    amount: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await fetch("/api/giftcards/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout failed");

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      setErrorMessage("Failed to create gift card checkout. Please try again.");
    }
  };

  return (
    <div className="giftcard-container">
      <h2>Send a Gift Card</h2>
      <p>Share the taste of Italy with someone you love.</p>

      <form onSubmit={handleSubmit} className="giftcard-form">
        {[
          { label: "Your Name", name: "senderName" },
          { label: "Recipient Name", name: "recipientName" },
          { label: "Recipient Email", name: "recipientEmail", type: "email" },
          { label: "Gift Amount (USD)", name: "amount", type: "number" },
        ].map(({ label, name, type = "text" }) => (
          <div className="form-group" key={name}>
            <label>{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <div className="form-group">
          <label>Message (Optional)</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Write a personalized note..."
          />
        </div>

        <button type="submit" className="giftcard-submit">
          Proceed to Checkout
        </button>

        {errorMessage && <p className="error-msg">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default GiftCard;
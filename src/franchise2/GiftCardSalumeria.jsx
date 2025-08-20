import React, { useState } from "react";
import { useSelector } from "react-redux";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient";
import "./css/GiftCardSalumeria.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const GiftCardSalumeria = ({ data }) => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);

  const [giftCardForm, setGiftCardForm] = useState({
    senderName: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    amount: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!data?.visible || !selectedFranchise) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGiftCardForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGiftCardPurchase = async (e) => {
    e.preventDefault();

    if (!selectedLocation?._id) {
      alert("Please select a location first");
      return;
    }

    const { senderName, recipientName, recipientEmail, amount } = giftCardForm;
    if (!senderName || !recipientName || !recipientEmail || !amount) {
      alert("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 5 || amountNum > 1000) {
      alert("Amount must be between $5 and $1000");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/giftcards/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...giftCardForm,
          amount: amountNum,
          locationId: selectedLocation._id,
          franchiseId: selectedFranchise._id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("Gift card purchase error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="giftcard-salumeria-container">
      {/* Background image as separate layer */}
      {data.wallpaperImage && (
        <div
          className="giftcard-background-image"
          style={{
            backgroundImage: `url(${urlFor(data.wallpaperImage)})`,
          }}
        />
      )}

      <div className="giftcard-salumeria-content">
        <h1>{data.title || "Gift Cards"}</h1>
        <p>{data.tagline || "Choose between an eGift or a physical gift card."}</p>

        {!showForm ? (
          <div className="giftcard-salumeria-options">
            <div className="giftcard-salumeria-box">
              <div className="giftcard-icon">
                <span>💳</span>
              </div>
              <h3>EGIFT CARD</h3>
              <p>Available in any denomination. Delivered in minutes or scheduled for later.</p>
              <button
                onClick={() => setShowForm(true)}
                className="giftcard-salumeria-button"
              >
                Purchase eGift Card
              </button>
            </div>

            <div className="giftcard-salumeria-box">
              <div className="giftcard-icon">
                <span>🎁</span>
              </div>
              <h3>TRADITIONAL GIFT CARD</h3>
              <p>A physical gift card mailed with flexible shipping options.</p>
              <button
                onClick={() => setShowForm(true)}
                className="giftcard-salumeria-button"
              >
                Purchase Physical Card
              </button>
            </div>
          </div>
        ) : (
          <div className="giftcard-purchase-form">
            <button className="back-button" onClick={() => setShowForm(false)}>
              ← Back to Options
            </button>

            <h2>Purchase Gift Card</h2>
            <form onSubmit={handleGiftCardPurchase}>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  name="senderName"
                  value={giftCardForm.senderName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Recipient Name *</label>
                <input
                  type="text"
                  name="recipientName"
                  value={giftCardForm.recipientName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Recipient Email *</label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={giftCardForm.recipientEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount ($5 - $1000) *</label>
                <input
                  type="number"
                  name="amount"
                  min="5"
                  max="1000"
                  step="1"
                  value={giftCardForm.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Personal Message (Optional)</label>
                <textarea
                  name="message"
                  rows="3"
                  value={giftCardForm.message}
                  onChange={handleInputChange}
                  placeholder="Add a personal message..."
                />
              </div>

              <div className="location-info">
                <p><strong>Location:</strong> {selectedLocation?.title}</p>
                <p><strong>Franchise:</strong> {selectedFranchise?.franchiseTitle}</p>
              </div>

              <button type="submit" className="purchase-button" disabled={isLoading}>
                {isLoading ? "Processing..." : "Purchase Gift Card"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftCardSalumeria;
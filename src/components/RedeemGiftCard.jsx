import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useSelector } from "react-redux";
import "./css/RedeemGiftCard.css";

const RedeemGiftCard = () => {
  const { user } = useAuth();
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  const [email, setEmail] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [amountToUse, setAmountToUse] = useState("");
  const [redeemMessage, setRedeemMessage] = useState("");
  const [error, setError] = useState("");

  const handleRedeem = async (e) => {
    e.preventDefault();
    setRedeemMessage("");
    setError("");

    if (!selectedLocation) {
      setError("Please select a restaurant location before redeeming.");
      return;
    }

    try {
      const payload = {
        email,
        giftCode,
        amountToUse: amountToUse ? parseFloat(amountToUse) : undefined,
        userId: user?.uid || null,
        locationId: selectedLocation._id,
      };

      const res = await fetch("/api/giftcards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Redemption failed");

      setRedeemMessage(`Successfully redeemed $${data.redeemedAmount}`);
      setEmail("");
      setGiftCode("");
      setAmountToUse("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="giftcard-container">
      <h2>Redeem Gift Card</h2>

      {!selectedLocation ? (
        <p className="error-msg" style={{ textAlign: "center" }}>
          Please select a restaurant location to redeem your gift card.
        </p>
      ) : (
        <form onSubmit={handleRedeem} className="giftcard-form">
          <div className="form-group">
            <label>Email associated with the gift card</label>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Gift Code</label>
            <input
              type="text"
              value={giftCode}
              required
              onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="e.g. 4G5YTX2L"
            />
          </div>

          <div className="form-group">
            <label>Amount to redeem (optional)</label>
            <input
              type="number"
              value={amountToUse}
              min="0"
              step="0.01"
              placeholder="Leave blank to use full balance"
              onChange={(e) => setAmountToUse(e.target.value)}
            />
          </div>

          <button type="submit" className="giftcard-submit">Redeem</button>

          {redeemMessage && <p className="success-msg">{redeemMessage}</p>}
          {error && <p className="error-msg">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default RedeemGiftCard;
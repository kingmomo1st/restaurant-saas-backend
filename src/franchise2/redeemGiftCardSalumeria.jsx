import React, { useState } from "react";
import { useSelector } from "react-redux";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient";
import "./css/RedeemGiftCardSalumeria.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const RedeemGiftCardSalumeria = ({ data }) => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);

  const [mode, setMode] = useState("check");
  const [formData, setFormData] = useState({
    email: "",
    giftCode: "",
    amountToUse: ""
  });
  const [cardNumber, setCardNumber] = useState("");
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!data?.visible || !selectedFranchise) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "giftCode" ? value.toUpperCase() : value,
    }));
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    setResult(null);
    setBalance(null);

    if (!cardNumber.trim()) {
      setResult({ success: false, message: "Please enter a valid card number." });
      return;
    }

    if (!selectedLocation?._id) {
      setResult({ success: false, message: "Please select a location first." });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/giftcards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "check@balance.com",
          giftCode: cardNumber.trim().toUpperCase(),
          locationId: selectedLocation._id,
          checkOnly: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to check balance.");

      const remaining = data.remainingAmount || data.balance;
      setBalance(remaining);
      setResult({
        success: true,
        message: `Gift card found! Balance: $${remaining.toFixed(2)}`
      });
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemGiftCard = async (e) => {
    e.preventDefault();

    if (!selectedLocation?._id) {
      setResult({ success: false, message: "Please select a location first." });
      return;
    }

    const { email, giftCode } = formData;
    if (!email || !giftCode) {
      setResult({ success: false, message: "Please enter both email and gift code." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResult({ success: false, message: "Please enter a valid email address." });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/giftcards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          giftCode: giftCode.toUpperCase(),
          amountToUse: formData.amountToUse ? parseFloat(formData.amountToUse) : null,
          locationId: selectedLocation._id,
          franchiseId: selectedFranchise._id,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to redeem gift card");

      setResult({
        success: true,
        message: "Gift card redeemed successfully!",
        details: {
          amountRedeemed: result.amount,
          remainingAmount: result.remainingAmount,
          giftCode: result.giftCode
        }
      });

      setFormData({ email: "", giftCode: "", amountToUse: "" });

    } catch (error) {
      console.error("Gift card redeem error:", error);
      setResult({
        success: false,
        message: error.message || "Something went wrong. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="redeem-salumeria-wrapper"
      style={{
        backgroundImage: data?.wallpaperImage ? `url(${urlFor(data.wallpaperImage)})` : "none",
      }}
    >
      <div className="redeem-salumeria-container">
        <h1>{data?.title || "Gift Card Center"}</h1>
        <p>{data?.description || "Check your balance or redeem your gift card."}</p>

        <div className="mode-selector">
          <button
            className={mode === "check" ? "active" : ""}
            onClick={() => {
              setMode("check");
              setResult(null);
              setBalance(null);
            }}
          >
            Check Balance
          </button>
          <button
            className={mode === "redeem" ? "active" : ""}
            onClick={() => {
              setMode("redeem");
              setResult(null);
              setBalance(null);
            }}
          >
            Redeem Gift Card
          </button>
        </div>

        {mode === "check" && (
          <form onSubmit={handleCheckBalance} className="redeem-salumeria-form">
            <input
              type="text"
              placeholder="Enter Gift Card Code (8 characters)"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.toUpperCase())}
              maxLength="8"
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Checking..." : "Check Balance"}
            </button>
          </form>
        )}

        {mode === "redeem" && (
          <form onSubmit={handleRedeemGiftCard} className="redeem-form">
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="giftCode"
                value={formData.giftCode}
                onChange={handleInputChange}
                placeholder="Enter your 8-character gift code"
                maxLength="8"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                name="amountToUse"
                min="0.01"
                step="0.01"
                value={formData.amountToUse}
                onChange={handleInputChange}
                placeholder="Amount to use (optional - leave blank for full amount)"
              />
              <small>Leave blank to redeem the full amount available</small>
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Redeem Gift Card"}
            </button>
          </form>
        )}

        {result && (
          <div className={`redeem-result ${result.success ? "success" : "error"}`}>
            <h3>{result.success ? "✅ Success!" : "❌ Error"}</h3>
            <p>{result.message}</p>
            {result.success && result.details && (
              <div className="redeem-details">
                <p><strong>Amount Redeemed:</strong> ${result.details.amountRedeemed?.toFixed(2)}</p>
                <p><strong>Remaining Balance:</strong> ${result.details.remainingAmount?.toFixed(2)}</p>
                <p><strong>Gift Code:</strong> {result.details.giftCode}</p>
              </div>
            )}
            <button onClick={() => setResult(null)} className="dismiss-button">
              Dismiss
            </button>
          </div>
        )}

        {balance !== null && mode === "check" && !result && (
          <div className="balance-display">
            <h3>Gift Card Balance</h3>
            <p className="balance-amount">${balance.toFixed(2)}</p>
          </div>
        )}

        <div className="location-info">
          <p><strong>Location:</strong> {selectedLocation?.title}</p>
          <p><strong>Franchise:</strong> {selectedFranchise?.franchiseTitle}</p>
        </div>

        <div className="redeem-help">
          <h3>Need Help?</h3>
          <p>
            If you're having trouble with your gift card, please contact us with your gift code and
            we'll be happy to assist you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RedeemGiftCardSalumeria;
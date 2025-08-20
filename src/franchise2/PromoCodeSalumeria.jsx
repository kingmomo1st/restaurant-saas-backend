import React, { useState, useEffect } from "react";
import sanityClient from "../sanity/sanityClient";
import { useSelector, useDispatch } from "react-redux";
import { applyPromoCode } from "../redux/promoCodeSlice";
import "./css/PromoCodeSalumeria.css";

const PromoCodeSalumeria = () => {
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const dispatch = useDispatch();

  const handleApplyPromo = async () => {
    if (!promoCodeInput || !selectedLocation?._id) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const query = `*[_type == "promoCodeSalumeria" && code == $code && location._ref == $loc && visible == true][0]`;
      const params = {
        code: promoCodeInput.toUpperCase(),
        loc: selectedLocation._id,
      };
      const promo = await sanityClient.fetch(query, params);

      if (!promo) {
        setStatusMessage("❌ Invalid or expired promo code.");
      } else {
        dispatch(
          applyPromoCode({
            code: promo.code,
            type: promo.discountType,
            value: promo.discountValue,
          })
        );
        setStatusMessage(`✅ Applied: ${promo.description || promo.code}`);
      }
    } catch (err) {
      console.error("Promo fetch failed:", err);
      setStatusMessage("❌ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="promo-salumeria-container">
      <h3>Have a Promo Code?</h3>
      <div className="promo-form">
        <input
          type="text"
          placeholder="Enter promo code"
          value={promoCodeInput}
          onChange={(e) => setPromoCodeInput(e.target.value)}
          disabled={loading}
        />
        <button onClick={handleApplyPromo} disabled={loading || !promoCodeInput}>
          {loading ? "Checking..." : "Apply"}
        </button>
      </div>
      {statusMessage && <p className="promo-message">{statusMessage}</p>}
    </div>
  );
};

export default PromoCodeSalumeria;
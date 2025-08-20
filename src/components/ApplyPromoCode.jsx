import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyPromoCode, clearPromoCode } from "../redux/promoCodeSlice";
import axios from "axios";

const ApplyPromoCode = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const appliedCode = useSelector((state) => state.promo.code);
  const [codeInput, setCodeInput] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleApply = async () => {
    setStatus(null);
    setMessage("");

    if (!codeInput.trim()) {
      setStatus("error");
      setMessage("Please enter a promo code.");
      return;
    }

    try {
      const res = await axios.post("/api/promo", {
        code: codeInput.trim().toUpperCase(),
        orderTotal: cartTotal,
        userId: "anonymous", // change if auth exists
      });

      if (res.data.valid) {
        const { code, type, value, minOrderAmount, applicableCategories } = res.data;

        dispatch(applyPromoCode({
          code,
          discountType: type,
          discountValue: value,
          minOrderAmount: minOrderAmount || null,
          applicableCategories: applicableCategories || [],
        }));

        setStatus("success");
        setMessage(`Promo applied! You saved $${res.data.discount.toFixed(2)}.`);
      }
    } catch (err) {
      const error = err.response?.data?.error || "Invalid promo code.";
      setStatus("error");
      setMessage(error);
    }
  };

  const handleClear = () => {
    dispatch(clearPromoCode());
    setCodeInput("");
    setStatus(null);
    setMessage("");
  };

  return (
    <div className="promo-code-container">
      <h4>Apply Promo Code</h4>
      {appliedCode ? (
        <div className="promo-success">
          <p>Promo <strong>{appliedCode}</strong> applied.</p>
          <button onClick={handleClear} className="btn-clear">Remove</button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="promo-input"
          />
          <button onClick={handleApply} className="btn-apply">Apply</button>
        </>
      )}
      {message && (
        <p className={`promo-message ${status === "success" ? "success" : "error"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ApplyPromoCode;
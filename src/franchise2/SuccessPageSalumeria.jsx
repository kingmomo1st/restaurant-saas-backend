import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../redux/cartSlice";
import "./css/SuccessPageSalumeria.css";

const SuccessPageSalumeria = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear the cart when payment is successful
    dispatch(clearCart());
  }, [dispatch]);

  const handleContinueShopping = () => {
    navigate("/order-online");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="salumeria-success-container">
      <div className="salumeria-success-content">
        <div className="salumeria-success-icon">
          <span className="success-emoji">🎉</span>
          <div className="success-checkmark">✓</div>
        </div>

        <h1 className="salumeria-success-title">Order Confirmed!</h1>

        <p className="salumeria-success-message">
          Thank you for your order! Your payment has been processed successfully.
        </p>

        <div className="salumeria-success-details">
          <div className="success-info-card">
            <h3>What happens next?</h3>
            <ul>
              <li>📧 You'll receive an email confirmation shortly</li>
              <li>👨‍🍳 Our chefs will start preparing your order</li>
              <li>⏰ Estimated ready time: 15-25 minutes</li>
              <li>📱 We'll notify you when your order is ready</li>
            </ul>
          </div>

          <div className="success-info-card">
            <h3>Need help?</h3>
            <p>If you have any questions about your order, please contact us:</p>
            <div className="contact-info">
              <span>📞 Call us: (555) 123-4567</span>
              <span>✉️ Email: orders@salumeria.com</span>
            </div>
          </div>
        </div>

        <div className="salumeria-success-actions">
          <button
            className="salumeria-success-btn primary"
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </button>
          <button
            className="salumeria-success-btn secondary"
            onClick={handleGoHome}
          >
            Back to Home
          </button>
        </div>

        <div className="salumeria-success-footer">
          <p>
            Order placed on {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPageSalumeria;
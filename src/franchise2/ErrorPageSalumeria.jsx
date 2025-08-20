import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./css/ErrorPageSalumeria.css";

const ErrorPageSalumeria = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get error details from URL params if available
  const errorType = searchParams.get("type") || "payment";
  const errorMessage =
    searchParams.get("message") || "Something went wrong with your order.";

  const handleTryAgain = () => {
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    navigate("/order-online");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const getErrorIcon = () => {
    switch (errorType) {
      case "payment":
        return "💳";
      case "network":
        return "🌐";
      case "server":
        return "⚠️";
      default:
        return "❌";
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case "payment":
        return "Payment Failed";
      case "network":
        return "Connection Error";
      case "server":
        return "Server Error";
      default:
        return "Order Failed";
    }
  };

  return (
    <div className="salumeria-error-container">
      <div className="salumeria-error-content">
        <div className="salumeria-error-icon">
          <span className="error-emoji">{getErrorIcon()}</span>
          <div className="error-x-mark">✕</div>
        </div>

        <h1 className="salumeria-error-title">{getErrorTitle()}</h1>

        <p className="salumeria-error-message">{errorMessage}</p>

        <div className="salumeria-error-details">
          <div className="error-info-card">
            <h3>What you can do:</h3>
            <ul>
              <li>🔄 Try placing your order again</li>
              <li>💳 Check your payment method details</li>
              <li>🌐 Ensure you have a stable internet connection</li>
              <li>📞 Contact us if the problem persists</li>
            </ul>
          </div>

          <div className="error-info-card">
            <h3>Need immediate help?</h3>
            <p>Our team is here to assist you with your order:</p>
            <div className="contact-info">
              <span>📞 Call us: (555) 123-4567</span>
              <span>✉️ Email: support@salumeria.com</span>
              <span>💬 Live chat available on our website</span>
            </div>
          </div>
        </div>

        <div className="salumeria-error-actions">
          <button
            className="salumeria-error-btn primary"
            onClick={handleTryAgain}
          >
            Try Again
          </button>
          <button
            className="salumeria-error-btn secondary"
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </button>
          <button
            className="salumeria-error-btn tertiary"
            onClick={handleGoHome}
          >
            Back to Home
          </button>
        </div>

        <div className="salumeria-error-footer">
          <p>Don't worry - your cart items are still saved!</p>
          <small>
            Error occurred on {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default ErrorPageSalumeria;
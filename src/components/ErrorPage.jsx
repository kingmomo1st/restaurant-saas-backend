import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./css/ErrorPage.css";

function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorDetails, setErrorDetails] = useState({
    type: "general",
    message: "Something went wrong.",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorType = params.get("error");
    const errorMsg = params.get("message");

    if (errorType === "payment") {
      setErrorDetails({
        type: "payment",
        message:
          errorMsg ||
          "Payment failed. Please check your payment method and try again.",
      });
    } else if (errorType === "order") {
      setErrorDetails({
        type: "order",
        message:
          errorMsg ||
          "Order processing failed. Please try placing your order again.",
      });
    } else if (errorType === "giftcard") {
      setErrorDetails({
        type: "giftcard",
        message:
          errorMsg ||
          "Gift card creation failed. Please check the details and try again.",
      });
    } else if (errorType === "reservation") {
      setErrorDetails({
        type: "reservation",
        message:
          errorMsg ||
          "Reservation booking failed. Please try again or call us directly.",
      });
    } else if (errorType === "private-dining") {
      setErrorDetails({
        type: "private-dining",
        message:
          errorMsg ||
          "Private dining request failed. Please try submitting again.",
      });
    } else if (errorType === "catering") {
      setErrorDetails({
        type: "catering",
        message:
          errorMsg ||
          "Catering request failed. Please check your details and try again.",
      });
    } else {
      setErrorDetails({
        type: "general",
        message:
          errorMsg ||
          "An unexpected error occurred. Please try again or contact support.",
      });
    }
  }, [location.search]);

  const getErrorContent = () => {
    switch (errorDetails.type) {
      case "payment":
        return {
          title: "Payment Failed 💳❌",
          icon: "💳❌",
          retryText: "Try Payment Again",
          retryPath: "/checkout",
          contactHelp:
            "If this persists, please contact your bank or try a different payment method.",
        };
      case "order":
        return {
          title: "Order Failed 🍕❌",
          icon: "🍕❌",
          retryText: "Back to Cart",
          retryPath: "/cart",
          contactHelp:
            "Our kitchen may be closed or we're experiencing high demand.",
        };
      case "giftcard":
        return {
          title: "Gift Card Failed 🎁❌",
          icon: "🎁❌",
          retryText: "Try Gift Card Again",
          retryPath: "/gift-card",
          contactHelp:
            "Please check the recipient email address and try again.",
        };
      case "reservation":
        return {
          title: "Reservation Failed 🍽️❌",
          icon: "🍽️❌",
          retryText: "Try Booking Again",
          retryPath: "/book-elegantly",
          contactHelp:
            "The requested time may be unavailable. Please try a different time or call us.",
        };
      case "private-dining":
        return {
          title: "Private Dining Request Failed 🥂❌",
          icon: "🥂❌",
          retryText: "Try Request Again",
          retryPath: "/private-dining",
          contactHelp:
            "Please check all required fields are filled and try again.",
        };
      case "catering":
        return {
          title: "Catering Request Failed 🍽️❌",
          icon: "🍽️❌",
          retryText: "Try Catering Again",
          retryPath: "/catering-request",
          contactHelp: "Please check your event details and contact information.",
        };
      default:
        return {
          title: "Something Went Wrong ⚠️",
          icon: "⚠️",
          retryText: "Back to Menu",
          retryPath: "/menu",
          contactHelp:
            "If this continues, please contact our support team.",
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">{content.icon}</div>
        <h2>{content.title}</h2>
        <div className="error-message">
          <p>{errorDetails.message}</p>
        </div>
        <div className="error-actions">
          <button
            className="retry-btn"
            onClick={() => navigate(content.retryPath)}
          >
            {content.retryText}
          </button>
          <button className="home-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
        <div className="error-help">
          <p className="help-text">{content.contactHelp}</p>
          <div className="contact-info">
            <p>
              <strong>Need help? Contact us:</strong>
            </p>
            <p>📧 support@romacucina.com</p>
            <p>📞 (555) 123-4567</p>
            <p>🕒 Mon-Sun: 11:00 AM - 10:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
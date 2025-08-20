import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./css/SuccessPage.css";

function SuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [latestOrder, setLatestOrder] = useState(null);
  const [giftCode, setGiftCode] = useState("");
  const [successType, setSuccessType] = useState("order");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("giftCode");
    const type = params.get("type");

    if (code) setGiftCode(code);
    if (type) setSuccessType(type);
  }, [location.search]);

  useEffect(() => {
    const fetchLatestOrder = async () => {
      if (!user?.uid) return;
      try {
        const res = await fetch(`/api/users/${user.uid}`);
        const data = await res.json();
        const orders = data.purchaseHistory || [];
        const lastOrder = orders[orders.length - 1];
        setLatestOrder(lastOrder);
      } catch (error) {
        console.error("Failed to fetch loyalty info:", error);
      }
    };

    if (successType === "order") {
      fetchLatestOrder();
    }
  }, [user, successType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 15000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const getSuccessContent = () => {
    switch (successType) {
      case "reservation":
        return {
          title: "Reservation Confirmed! 🍽️",
          message: "Your table reservation has been successfully booked.",
          details:
            "You will receive a confirmation email shortly with all the details.",
          icon: "🎉",
        };
      case "private-dining":
        return {
          title: "Private Dining Request Sent! 🥂",
          message: "Your private dining inquiry has been submitted.",
          details:
            "Our events team will contact you within 24 hours to discuss your requirements.",
          icon: "✨",
        };
      case "catering":
        return {
          title: "Catering Request Received! 🍕",
          message: "Your catering request has been successfully submitted.",
          details:
            "Our catering team will contact you soon with a customized quote.",
          icon: "🎊",
        };
      case "giftcard":
        return {
          title: "Gift Card Created! 🎁",
          message: "Your gift card has been successfully created and sent.",
          details:
            "The recipient will receive an email with the gift code shortly.",
          icon: "💝",
        };
      default:
        return {
          title: "Order Successful! 🍝",
          message: "Thank you for your order! Payment was successful.",
          details:
            "You will receive an order confirmation email shortly.",
          icon: "🎉",
        };
    }
  };

  const content = getSuccessContent();

  return (
    <div className="success-container">
      <div className="success-icon">{content.icon}</div>
      <h2>{content.title}</h2>
      <p className="success-message">{content.message}</p>
      <p className="success-details">{content.details}</p>

      {giftCode && (
        <div className="gift-success">
          <div className="gift-code-display">
            <span className="code-label">Gift Code:</span>
            <span className="code-box">{giftCode}</span>
          </div>
          <p>This code has been sent to the recipient's email.</p>
          <p>They can redeem it using their email + this code.</p>
        </div>
      )}

      {user && latestOrder && successType === "order" && !giftCode && (
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="order-items">
            {latestOrder.items?.map((item, index) => (
              <div key={index} className="ordered-item">
                <div className="item-name">
                  <strong>{item.name}</strong> x {item.quantity}
                </div>
                <div className="item-price">
                  ${item.price.toFixed(2)}
                </div>
                {item.modifiers?.length > 0 && (
                  <div className="modifiers-list">
                    {item.modifiers.map((mod, i) => (
                      <span key={i} className="modifier">
                        + {mod.name}
                        {mod.price ? ` (+$${mod.price.toFixed(2)})` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="total-line">
              <span>Subtotal:</span>
              <span>${latestOrder.total.toFixed(2)}</span>
            </div>

            {latestOrder.promoCode && (
              <div className="total-line discount">
                <span>Promo ({latestOrder.promoCode}):</span>
                <span>-${latestOrder.promoDiscount?.toFixed(2)}</span>
              </div>
            )}

            {latestOrder.pointsUsed > 0 && (
              <div className="total-line points">
                <span>Loyalty Points Used:</span>
                <span>{latestOrder.pointsUsed} pts</span>
              </div>
            )}

            <div className="total-line final">
              <span>
                <strong>Final Total:</strong>
              </span>
              <span>
                <strong>
                  ${latestOrder.discountedTotal?.toFixed(2)}
                </strong>
              </span>
            </div>

            <div className="loyalty-earned">
              <span>
                Points Earned: +{Math.round(latestOrder.discountedTotal)}
              </span>
            </div>

            <div className="order-id">
              Order ID: {latestOrder.orderId}
            </div>
          </div>
        </div>
      )}

      <div className="success-actions">
        <button className="back-home-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>

        {successType === "order" && (
          <button
            className="order-again-btn"
            onClick={() => navigate("/menu")}
          >
            Order Again
          </button>
        )}

        {successType === "reservation" && (
          <button
            className="menu-btn"
            onClick={() => navigate("/menu")}
          >
            View Menu
          </button>
        )}
      </div>
    </div>
  );
}

export default SuccessPage;
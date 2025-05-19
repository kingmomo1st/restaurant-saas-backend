import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import "./css/SuccessPage.css";

function SuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latestOrder, setLatestOrder] = useState(null);

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

    fetchLatestOrder();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 10000); // Auto-redirect after 10 seconds
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="success-container">
      <h2>Thank You for Your Order!</h2>
      <p>Your payment was successful.</p>

      {user && latestOrder ? (
        <div className="loyalty-summary">
          <h3>Order Summary</h3>
          <p><strong>Total Paid:</strong> ${latestOrder.total}</p>
          <p><strong>Points Earned:</strong> {Math.round(latestOrder.total)}</p>
          <p><strong>Order ID:</strong> {latestOrder.orderId}</p>
        </div>
      ) : (
        <p className="guest-message">
          Your order has been placed successfully. Check your email for confirmation.
        </p>
      )}

      <button className="back-home-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}

export default SuccessPage;
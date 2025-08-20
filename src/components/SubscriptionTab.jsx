import React, { useState } from "react";
import axios from "axios";
import "./css/AdminDashboard.css";
import { useAuth } from "./AuthContext";
import { useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js"; // ✅ add this

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY); // ✅ initialize once

const SubscriptionTab = () => {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedLocation = useSelector((state) => state.franchise.selectedLocation);

  const { user, locationId } = useAuth();

  const handleSubscribe = async () => {
    if (!selectedPlan) return alert("Please select a plan");
    if (!user?.email || !user?.uid) return alert("User info missing");

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/subscription/create-subscription-session`,
        {
          userEmail: user.email,
          userId: user.uid,
          plan: selectedPlan,
          locationId: locationId || "default",
        }
      );

      const stripe = await stripePromise;

      if (!stripe || typeof stripe.redirectToCheckout !== "function") {
        console.error("❌ Stripe failed to initialize:", stripe);
        return alert("Stripe setup failed. Check your API key.");
      }

      const sessionId = response.data.id;
      if (!sessionId) {
        console.error("❌ Invalid session from backend:", response.data);
        return alert("Subscription session failed.");
      }

      const result = await stripe.redirectToCheckout({ sessionId });
      if (result.error) {
        console.error("❌ Stripe redirect error:", result.error.message);
        alert(result.error.message);
      }
    } catch (err) {
      console.error("Subscription error:", err);
      alert("Subscription failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-tab">
      <h2>Manage Subscription</h2>
      <div className="plan-options">
        <label>
          <input
            type="radio"
            value="starter"
            checked={selectedPlan === "starter"}
            onChange={() => setSelectedPlan("starter")}
          />
          Starter Plan - $49/mo
        </label>
        <label>
          <input
            type="radio"
            value="pro"
            checked={selectedPlan === "pro"}
            onChange={() => setSelectedPlan("pro")}
          />
          Pro Plan - $99/mo
        </label>
        <label>
          <input
            type="radio"
            value="elite"
            checked={selectedPlan === "elite"}
            onChange={() => setSelectedPlan("elite")}
          />
          Elite Plan - $199/mo
        </label>
      </div>
      <button
        onClick={handleSubscribe}
        disabled={loading || !user?.email || !user?.uid}
        style={{ marginTop: "20px" }}
      >
        {loading ? "Processing..." : "Subscribe"}
      </button>
    </div>
  );
};

export default SubscriptionTab;
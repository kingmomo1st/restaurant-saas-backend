import React, { useState } from "react";
import { useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import "./css/SubscriptionPanel.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscriptionPanel = () => {
  const user = useSelector((state) => state.user.currentUser);
  const selectedLocation = useSelector((state) => state.franchise.selectedLocation);
  const [loadingId, setLoadingId] = useState(null);

  const plans = [
    {
      name: "Starter Plan",
      price: "$49/mo",
      planKey: "starter",
      features: ["Basic CMS", "Up to 2 Admin Users", "Email Support"],
    },
    {
      name: "Pro Plan",
      price: "$99/mo",
      planKey: "pro",
      features: ["All Starter Features", "Unlimited Admins", "Priority Support"],
    },
    {
      name: "Elite Plan",
      price: "$199/mo",
      planKey: "elite",
      features: ["All Pro Features", "White-Label Branding", "Custom Domain"],
    },
  ];

  const handleSubscribe = async (planKey) => {
    setLoadingId(planKey);
    try {
      const stripe = await stripePromise;

      const res = await fetch("/api/subscription/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          userEmail: user?.email,
          userId: user?.uid,
          locationId: selectedLocation?._id || "default",
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Subscription failed");

      const result = await stripe.redirectToCheckout({ sessionId: data.id });
      if (result.error) alert(result.error.message);
    } catch (err) {
      console.error("Stripe subscription error:", err);
      alert("Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="subscription-panel-container">
      <h2>Choose a Subscription Plan</h2>
      <div className="plan-cards-container">
        {plans.map((plan) => (
          <div className="plan-card" key={plan.planKey}>
            <h3>{plan.name}</h3>
            <p className="plan-price">{plan.price}</p>
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>✅ {feature}</li>
              ))}
            </ul>
            <button
              className="subscribe-button"
              onClick={() => handleSubscribe(plan.planKey)}
              disabled={loadingId === plan.planKey}
            >
              {loadingId === plan.planKey ? "Redirecting..." : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPanel;
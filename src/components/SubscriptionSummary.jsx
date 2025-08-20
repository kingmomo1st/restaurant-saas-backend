import React from "react";
import { useAuth } from "./AuthContext";
import "./css/SubscriptionSummary.css"; // optional style file
import { useState } from "react";
import CancelSubscriptionButton from "./CancelSubscriptionButton";
import ResumeSubscriptionButton from "./ResumeSubscriptionButton";

const SubscriptionSummary = () => {
  const { subscription } = useAuth();

  if (!subscription) {
    return <p>No active subscription found.</p>;
  }

  const {
    plan,
    status,
    current_period_end,
    cancel_at_period_end,
  } = subscription;

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp * 1000); // Stripe timestamps are in seconds
    return date.toLocaleDateString();
  };

  const statusColor = {
    active: "green",
    trialing: "blue",
    past_due: "orange",
    canceled: "gray",
    incomplete: "red",
  };

  return (
    <div className="subscription-summary-box">
      <h3>📦 Current Subscription</h3>
      <p>
        <strong>Plan:</strong> {plan || "Free"}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <span
          style={{
            color: statusColor[status] || "black",
            fontWeight: "bold",
            textTransform: "capitalize",
          }}
        >
          {status}
        </span>
      </p>
      <p>
        <strong>Renews On:</strong> {formatDate(current_period_end)}
      </p>
      {cancel_at_period_end ? (
  <>
    <p style={{ color: "red", fontWeight: "bold" }}>
      ⚠️ Will cancel at the end of this billing period
    </p>
    <ResumeSubscriptionButton subscriptionId={subscription.id} />
  </>
) : (
  <CancelSubscriptionButton subscriptionId={subscription.id} />
)}
    </div>
  );
};

export default SubscriptionSummary;
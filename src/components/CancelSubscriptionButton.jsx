import React, { useState } from "react";

const CancelSubscriptionButton = ({ subscriptionId }) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      setLoading(true);
      const res = await fetch("/api/subscription/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel.");

      alert("Subscription will be canceled at the end of the billing period.");
      window.location.reload(); // or re-fetch if using SWR
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Error canceling subscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCancel} disabled={loading}>
      {loading ? "Cancelling..." : "Cancel Subscription"}
    </button>
  );
};

export default CancelSubscriptionButton;
import React, { useState } from "react";

const ResumeSubscriptionButton = ({ subscriptionId }) => {
  const [loading, setLoading] = useState(false);

  const handleResume = async () => {
    if (!window.confirm("Resume your subscription?")) return;

    try {
      setLoading(true);
      const res = await fetch("/api/subscription/resume-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resume.");

      alert("Subscription resumed successfully.");
      window.location.reload();
    } catch (err) {
      console.error("Resume error:", err);
      alert("Error resuming subscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleResume} disabled={loading}>
      {loading ? "Resuming..." : "Resume Subscription"}
    </button>
  );
};

export default ResumeSubscriptionButton;
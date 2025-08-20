import React, { useState } from "react";
import axios from "axios";
import "./css/AbandonedCarts.css";

const AbandonedCarts = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckAbandonedCarts = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post("/api/check-abandoned-carts");
      setResult(res.data);
    } catch (err) {
      console.error("❌ Abandoned cart check failed:", err);
      setError("Failed to check abandoned carts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="abandoned-carts-panel">
      <h2>🛒 Abandoned Carts</h2>
      <p>
        Trigger the cron job manually to send reminder emails to users who left items
        in their cart more than 6 hours ago.
      </p>
      <button onClick={handleCheckAbandonedCarts} disabled={loading}>
        {loading ? "Checking..." : "Check & Send Reminders"}
      </button>

      {error && <p className="error-msg">{error}</p>}

      {result && (
        <div className="result-box">
          <p>✅ Reminders sent to <strong>{result.emails.length}</strong> user(s).</p>
          {result.emails.length > 0 && (
            <ul>
              {result.emails.map((email, index) => (
                <li key={index}>{email}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AbandonedCarts;
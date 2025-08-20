import React, { useState } from "react";

const TestDataPage = () => {
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [privateDining, setPrivateDining] = useState([]);
  const [loading, setLoading] = useState(false);

  const testOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      console.log("✅ Orders:", data);
      setOrders(data);
    } catch (err) {
      console.error("❌ Orders error:", err);
    }
    setLoading(false);
  };

  const testReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reservations");
      const data = await response.json();
      console.log("✅ Reservations:", data);
      setReservations(data);
    } catch (err) {
      console.error("❌ Reservations error:", err);
    }
    setLoading(false);
  };

  const testPrivateDining = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/private-dining");
      const data = await response.json();
      console.log("✅ Private Dining:", data);
      setPrivateDining(data);
    } catch (err) {
      console.error("❌ Private Dining error:", err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🧪 DATA TEST PAGE</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={testOrders} disabled={loading}>
          Test Orders API
        </button>
        <button
          onClick={testReservations}
          disabled={loading}
          style={{ marginLeft: "10px" }}
        >
          Test Reservations API
        </button>
        <button
          onClick={testPrivateDining}
          disabled={loading}
          style={{ marginLeft: "10px" }}
        >
          Test Private Dining API
        </button>
      </div>

      {loading && <p>Loading...</p>}

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <h3>Orders ({orders.length})</h3>
          <div
            style={{
              maxHeight: "300px",
              overflow: "auto",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  marginBottom: "10px",
                  padding: "5px",
                  background: "#f5f5f5",
                }}
              >
                <strong>{order.customerName}</strong> - ${order.total} (
                {order.status})
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Reservations ({reservations.length})</h3>
          <div
            style={{
              maxHeight: "300px",
              overflow: "auto",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            {reservations.map((res) => (
              <div
                key={res.id}
                style={{
                  marginBottom: "10px",
                  padding: "5px",
                  background: "#f5f5f5",
                }}
              >
                <strong>{res.customerName}</strong> - {res.date} ({res.status})
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Private Dining ({privateDining.length})</h3>
          <div
            style={{
              maxHeight: "300px",
              overflow: "auto",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            {privateDining.map((pd) => (
              <div
                key={pd.id}
                style={{
                  marginBottom: "10px",
                  padding: "5px",
                  background: "#f5f5f5",
                }}
              >
                <strong>{pd.requesterName}</strong> - {pd.date} ({pd.status})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDataPage;
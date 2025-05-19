import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import AdminDashboard from "./AdminDashboard";
import "./css/Dashboard.css";

function Dashboard() {
  const { user, isAdmin, logout, loading } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && !isAdmin) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(firestore, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPoints(data.points || 0);
            setHistory(data.purchaseHistory || []);
          }
        } catch (error) {
          console.error("Error fetching loyalty data:", error);
        }
      };
      fetchUserData();
    }
  }, [user, isAdmin]);

  if (loading) return <p>Loading dashboard...</p>;
  if (!user || isAdmin) return null;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.email}</h2>
      <p><strong>Your Points:</strong> {points}</p>

      <div className="dashboard-actions">
        <Link to="/menu" className="btn">Explore Menu</Link>
        <button onClick={logout} className="btn logout">Log Out</button>
      </div>

      <h3>Your Purchase History</h3>
      {history.length > 0 ? (
        <ul className="purchase-history">
          {history.map((entry, index) => (
            <li key={index}>
              <p><strong>Order ID:</strong> {entry.orderId}</p>
              <p><strong>Total:</strong> ${entry.total.toFixed(2)}</p>
              <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>You haven't made any purchases yet.</p>
      )}
    </div>
  );
}

export default Dashboard;
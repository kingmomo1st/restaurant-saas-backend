// LoyaltyAnalytics.jsx
import React, { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import "./css/LoyaltyAnalytics.css";

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const LoyaltyAnalytics = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(firestore, "users"));
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(fetched);
    };
    fetchUsers();
  }, []);

  const pointsEarned = users.reduce((sum, user) => sum + (user.loyaltyPoints || 0), 0);
  const totalRedeemed = users.reduce((sum, user) => sum + (user.pointsRedeemed || 0), 0);
  const topRedeemers = [...users]
    .filter(u => u.pointsRedeemed)
    .sort((a, b) => b.pointsRedeemed - a.pointsRedeemed)
    .slice(0, 5);

  const redemptionRate = pointsEarned > 0 ? ((totalRedeemed / pointsEarned) * 100).toFixed(1) : "0";

  return (
    <div className="loyalty-analytics">
      <h2>Loyalty Analytics</h2>

      <div className="stat-grid">
        <div className="stat-card"><h4>Points Earned</h4><p>{pointsEarned}</p></div>
        <div className="stat-card"><h4>Points Redeemed</h4><p>{totalRedeemed}</p></div>
        <div className="stat-card"><h4>Redemption Rate</h4><p>{redemptionRate}%</p></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Top Redeemers</h3>
          <Bar
            data={{
              labels: topRedeemers.map(u => u.email || "Unknown"),
              datasets: [{
                label: "Points Redeemed",
                data: topRedeemers.map(u => u.pointsRedeemed),
                backgroundColor: "#FF6384",
              }],
            }}
            options={{ responsive: true }}
          />
        </div>

        <div className="chart-card">
          <h3>Points Earned vs Redeemed</h3>
          <Doughnut
            data={{
              labels: ["Earned", "Redeemed"],
              datasets: [{
                data: [pointsEarned, totalRedeemed],
                backgroundColor: ["#36A2EB", "#FFCE56"],
              }],
            }}
            options={{ responsive: true }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoyaltyAnalytics;
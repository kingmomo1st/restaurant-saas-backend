import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const BillingSpendChart = () => {
  const { user } = useAuth();
  const [monthlyTotals, setMonthlyTotals] = useState([]);

  useEffect(() => {
    const fetchAndProcess = async () => {
      const res = await fetch(`/api/subscription/invoices/${user.email}`);
      const data = await res.json();

      const monthly = {};
      data.forEach((inv) => {
        const month = new Date(inv.created * 1000).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        monthly[month] = (monthly[month] || 0) + inv.amount_paid / 100;
      });

      const chartData = Object.entries(monthly).map(([month, total]) => ({
        month,
        total: parseFloat(total.toFixed(2)),
      }));

      setMonthlyTotals(chartData);
    };

    if (user?.email) fetchAndProcess();
  }, [user?.email]);

  if (!monthlyTotals.length) return null;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h4>📊 Monthly Spend</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyTotals}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#0070f3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BillingSpendChart;
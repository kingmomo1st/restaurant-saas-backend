import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "./css/AnalyticsPanel.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const CustomerSegmentationDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [filter, setFilter] = useState("30");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin } = useAuth();

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }

      const [usersRes, ordersRes] = await Promise.all([
        fetch(`/api/users?${params.toString()}`),
        fetch(`/api/orders?${params.toString()}`),
      ]);

      if (usersRes.ok && ordersRes.ok) {
        const usersData = await usersRes.json();
        const ordersData = await ordersRes.json();

        setCustomers(usersData);
        setOrders(ordersData);

        console.log(`✅ Customer Analytics: ${usersData.length} customers, ${ordersData.length} orders`);
      }
    } catch (error) {
      console.error("❌ Customer analytics error:", error);
    } finally {
      setLoading(false);
    }
  };


// RFM Analysis (Recency, Frequency, Monetary)
const analyzeCustomerSegments = () => {
const now = new Date();
const segments = {
vip: [],
loyal: [],
bigSpenders: [],
newCustomers: [],
atRisk: [],
lost: []
};


customers.forEach(customer => {
  if (customer.orderCount === 0) return; // Skip customers with no orders

  const daysSinceLastOrder = customer.lastOrderDate 
    ? Math.floor((now - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24))
    : 999;

  const frequency = customer.orderCount || 0;
  const monetary = customer.totalSpent || 0;
  const avgOrderValue = frequency > 0 ? monetary / frequency : 0;

  // Segmentation Logic
  if (frequency >= 10 && monetary >= 500 && daysSinceLastOrder <= 30) {
    segments.vip.push({ ...customer, daysSinceLastOrder, avgOrderValue });
  } else if (frequency >= 5 && daysSinceLastOrder <= 45) {
    segments.loyal.push({ ...customer, daysSinceLastOrder, avgOrderValue });
  } else if (monetary >= 300 && frequency <= 4) {
    segments.bigSpenders.push({ ...customer, daysSinceLastOrder, avgOrderValue });
  } else if (frequency <= 2 && daysSinceLastOrder <= 30) {
    segments.newCustomers.push({ ...customer, daysSinceLastOrder, avgOrderValue });
  } else if (frequency >= 3 && daysSinceLastOrder >= 46 && daysSinceLastOrder <= 90) {
    segments.atRisk.push({ ...customer, daysSinceLastOrder, avgOrderValue });
  } else if (daysSinceLastOrder > 90) {
    segments.lost.push({ ...customer, daysSinceLastOrder, avgOrderValue });
  }
});

return segments;


};

// Customer Lifecycle Analysis
const analyzeCustomerLifecycle = () => {
const lifecycle = {
new: 0,      // 0-30 days since first order
growing: 0,  // 31-90 days, increasing orders
mature: 0,   // 90+ days, regular orders
declining: 0 // Decreasing order frequency
};


customers.forEach(customer => {
  if (customer.orderCount === 0) return;

  const daysSinceFirstOrder = customer.createdAt 
    ? Math.floor((new Date() - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24))
    : 0;

  const daysSinceLastOrder = customer.lastOrderDate 
    ? Math.floor((new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceFirstOrder <= 30) {
    lifecycle.new++;
  } else if (daysSinceFirstOrder <= 90 && customer.orderCount >= 2) {
    lifecycle.growing++;
  } else if (daysSinceFirstOrder > 90 && daysSinceLastOrder <= 45) {
    lifecycle.mature++;
  } else {
    lifecycle.declining++;
  }
});

return lifecycle;


};

// Purchase Behavior Analysis
const analyzePurchaseBehavior = () => {
const behavior = {
weekly: 0,    // Orders every 1-7 days
biweekly: 0,  // Orders every 8-14 days
monthly: 0,   // Orders every 15-30 days
occasional: 0 // Orders every 30+ days
};


customers.forEach(customer => {
  if (customer.orderCount <= 1) return;

  const avgDaysBetweenOrders = customer.lastOrderDate && customer.createdAt
    ? Math.floor((new Date(customer.lastOrderDate) - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24)) / customer.orderCount
    : 999;

  if (avgDaysBetweenOrders <= 7) {
    behavior.weekly++;
  } else if (avgDaysBetweenOrders <= 14) {
    behavior.biweekly++;
  } else if (avgDaysBetweenOrders <= 30) {
    behavior.monthly++;
  } else {
    behavior.occasional++;
  }
});

return behavior;


};

// Customer Value Distribution
const analyzeCustomerValue = () => {
const valueSegments = {
premium: 0,   // $500+
high: 0,      // $200-499
medium: 0,    // $50-199
low: 0        // $0-49
};


customers.forEach(customer => {
  const totalSpent = customer.totalSpent || 0;
  
  if (totalSpent >= 500) {
    valueSegments.premium++;
  } else if (totalSpent >= 200) {
    valueSegments.high++;
  } else if (totalSpent >= 50) {
    valueSegments.medium++;
  } else {
    valueSegments.low++;
  }
});

return valueSegments;


};

// Revenue by Customer Segment
const calculateSegmentRevenue = (segments) => {
const revenue = {};
Object.entries(segments).forEach(([segment, customers]) => {
revenue[segment] = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);
});
return revenue;
};

// Top Customers Analysis
const getTopCustomers = () => {
return customers
.filter(customer => customer.totalSpent > 0)
.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
.slice(0, 10)
.map(customer => ({
name: customer.name,
email: customer.email,
totalSpent: customer.totalSpent || 0,
orderCount: customer.orderCount || 0,
avgOrderValue: customer.orderCount > 0 ? (customer.totalSpent / customer.orderCount) : 0,
tier: customer.tier || 'Bronze',
lastOrder: customer.lastOrderDate || 'Never'
}));
};

const segments = analyzeCustomerSegments();
const lifecycle = analyzeCustomerLifecycle();
const behavior = analyzePurchaseBehavior();
const valueSegments = analyzeCustomerValue();
const segmentRevenue = calculateSegmentRevenue(segments);
const topCustomers = getTopCustomers();

// Calculate key metrics
const totalCustomers = customers.length;
const activeCustomers = customers.filter(c => c.orderCount > 0).length;
const averageLifetimeValue = activeCustomers > 0
? customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / activeCustomers
: 0;
const retentionRate = activeCustomers > 0
? ((segments.vip.length + segments.loyal.length) / activeCustomers * 100)
: 0;

useEffect(() => {
fetchCustomerData();
}, [selectedFranchise, selectedLocation]);

useEffect(() => {
if (shouldRefresh) {
fetchCustomerData();
setShouldRefresh(false);
}
}, [shouldRefresh]);

if (loading) {
return (
<div className="analytics-panel">
<p>Loading customer segmentation…</p>
</div>
);
}

return (
<div className="analytics-panel">
  <h2>👥 Customer Segmentation Analytics</h2>
  <button onClick={() => setShouldRefresh(true)} className="refresh-btn">
    🔄 Refresh Data
  </button>

  <div className="calendar-controls">
    <label>Analysis Period:</label>
    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
      <option value="30">Last 30 Days</option>
      <option value="90">Last 90 Days</option>
      <option value="180">Last 6 Months</option>
      <option value="365">Last Year</option>
    </select>
  </div>

  {(isSuperAdmin || selectedFranchise?._id) ? (
    <>
      {/* Key Metrics */}
      <div className="stat-grid">
        <div className="stat-card">
          <h4>👥 Total Customers</h4>
          <p className="stat-value">{totalCustomers}</p>
          <small>Active: {activeCustomers} ({((activeCustomers/totalCustomers)*100).toFixed(1)}%)</small>
        </div>
        
        <div className="stat-card">
          <h4>💰 Avg Lifetime Value</h4>
          <p className="stat-value">${averageLifetimeValue.toFixed(2)}</p>
          <small>Per active customer</small>
        </div>
        
        <div className="stat-card">
          <h4>🔄 Retention Rate</h4>
          <p className="stat-value">{retentionRate.toFixed(1)}%</p>
          <small>VIP + Loyal customers</small>
        </div>
        
        <div className="stat-card">
          <h4>💎 VIP Customers</h4>
          <p className="stat-value">{segments.vip.length}</p>
          <small>Revenue: ${segmentRevenue.vip.toFixed(2)}</small>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="chart-grid">
        <div className="chart-card">
          <h3>🎯 Customer Segments</h3>
          <Doughnut
            data={{
              labels: ['VIP', 'Loyal', 'Big Spenders', 'New', 'At Risk', 'Lost'],
              datasets: [{
                data: [
                  segments.vip.length,
                  segments.loyal.length,
                  segments.bigSpenders.length,
                  segments.newCustomers.length,
                  segments.atRisk.length,
                  segments.lost.length
                ],
                backgroundColor: [
                  '#FFD700', // VIP - Gold
                  '#2ecc71', // Loyal - Green
                  '#3498db', // Big Spenders - Blue
                  '#1abc9c', // New - Teal
                  '#f39c12', // At Risk - Orange
                  '#e74c3c'  // Lost - Red
                ],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const segment = context.label;
                      const count = context.parsed;
                      const revenue = segmentRevenue[segment.toLowerCase().replace(' ', '')] || 0;
                      return `${segment}: ${count} customers ($${revenue.toFixed(2)} revenue)`;
                    }
                  }
                }
              }
            }}
          />
        </div>

        <div className="chart-card">
          <h3>📊 Customer Lifecycle</h3>
          <Bar
            data={{
              labels: ['New', 'Growing', 'Mature', 'Declining'],
              datasets: [{
                label: 'Customers',
                data: [lifecycle.new, lifecycle.growing, lifecycle.mature, lifecycle.declining],
                backgroundColor: ['#1abc9c', '#2ecc71', '#3498db', '#e74c3c'],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>

        <div className="chart-card">
          <h3>🛒 Purchase Behavior</h3>
          <Doughnut
            data={{
              labels: ['Weekly', 'Bi-weekly', 'Monthly', 'Occasional'],
              datasets: [{
                data: [behavior.weekly, behavior.biweekly, behavior.monthly, behavior.occasional],
                backgroundColor: ['#2ecc71', '#3498db', '#f39c12', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }}
          />
        </div>

        <div className="chart-card">
          <h3>💸 Customer Value Distribution</h3>
          <Bar
            data={{
              labels: ['Premium ($500+)', 'High ($200-499)', 'Medium ($50-199)', 'Low ($0-49)'],
              datasets: [{
                label: 'Customers',
                data: [valueSegments.premium, valueSegments.high, valueSegments.medium, valueSegments.low],
                backgroundColor: ['#FFD700', '#3498db', '#2ecc71', '#95a5a6'],
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      </div>

      {/* Segment Details */}
      <div className="segment-details">
        <h3>🔍 Segment Analysis</h3>
        <div className="segment-grid">
          <div className="segment-card vip">
            <h4>💎 VIP Customers ({segments.vip.length})</h4>
            <p>Revenue: ${segmentRevenue.vip.toLocaleString()}</p>
            <small>10+ orders, $500+ spent, active within 30 days</small>
          </div>
          
          <div className="segment-card loyal">
            <h4>🔄 Loyal Customers ({segments.loyal.length})</h4>
            <p>Revenue: ${segmentRevenue.loyal.toLocaleString()}</p>
            <small>5+ orders, active within 45 days</small>
          </div>
          
          <div className="segment-card big-spenders">
            <h4>💰 Big Spenders ({segments.bigSpenders.length})</h4>
            <p>Revenue: ${segmentRevenue.bigSpenders.toLocaleString()}</p>
            <small>High value orders, less frequent</small>
          </div>
          
          <div className="segment-card at-risk">
            <h4>⚠️ At Risk ({segments.atRisk.length})</h4>
            <p>Revenue: ${segmentRevenue.atRisk.toLocaleString()}</p>
            <small>Previous customers, 46-90 days inactive</small>
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="top-customers">
        <h3>🏆 Top Customers</h3>
        <div className="customers-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Total Spent</th>
                <th>Orders</th>
                <th>Avg Order</th>
                <th>Tier</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer, index) => (
                <tr key={index}>
                  <td>
                    <strong>{customer.name}</strong><br/>
                    <small>{customer.email}</small>
                  </td>
                  <td>${customer.totalSpent.toLocaleString()}</td>
                  <td>{customer.orderCount}</td>
                  <td>${customer.avgOrderValue.toFixed(2)}</td>
                  <td>
                    <span className={`tier-badge ${customer.tier.toLowerCase()}`}>
                      {customer.tier}
                    </span>
                  </td>
                  <td>
                    {customer.lastOrder !== 'Never' 
                      ? new Date(customer.lastOrder).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Insights */}
      <div className="executive-insights">
        <h3>💡 Customer Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>🎯 Revenue Concentration</h4>
            <p>{segments.vip.length + segments.loyal.length} customers ({(((segments.vip.length + segments.loyal.length) / activeCustomers) * 100).toFixed(1)}%) generate ${(segmentRevenue.vip + segmentRevenue.loyal).toLocaleString()} in revenue</p>
          </div>
          
          <div className="insight-card">
            <h4>⚠️ Churn Risk</h4>
            <p>{segments.atRisk.length + segments.lost.length} customers need re-engagement campaigns</p>
          </div>
          
          <div className="insight-card">
            <h4>🌱 Growth Opportunity</h4>
            <p>{segments.newCustomers.length} new customers can be nurtured into loyal segments</p>
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="no-data-message">
      <h3>🏢 Select a Franchise</h3>
      <p>Please select a franchise to view customer segmentation analytics.</p>
    </div>
  )}
</div>


);
};

export default CustomerSegmentationDashboard;
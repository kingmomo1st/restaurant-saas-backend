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

const EMERGENCY_MODE = false;

const AnalyticsPanel = () => {
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [privateDining, setPrivateDining] = useState([]);
  const [events, setEvents] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [filter, setFilter] = useState("30");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin } = useAuth();

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }

      const [ordersRes, reservationsRes, privateDiningRes, eventsRes, giftCardsRes, usersRes] = await Promise.all([
        fetch(`/api/orders?${params.toString()}`),
        fetch(`/api/reservations?${params.toString()}`),
        fetch(`/api/private-dining?${params.toString()}`),
        fetch(`/api/events?${params.toString()}`),
        fetch(`/api/giftcards?${params.toString()}`).catch(() => ({ ok: false })),
        fetch(`/api/users?${params.toString()}`),
      ]);

      console.log("🔍 Franchise filtering params:", {
        selectedFranchise: selectedFranchise?._id,
        selectedLocation: selectedLocation?._id,
        isSuperAdmin: isSuperAdmin,
        params: params.toString()
      });
      
  const ordersData = ordersRes.ok ? await ordersRes.json() : [];
  const reservationsData = reservationsRes.ok ? await reservationsRes.json() : [];
  const privateDiningData = privateDiningRes.ok ? await privateDiningRes.json() : [];
  const eventsData = eventsRes.ok ? await eventsRes.json() : [];
  const giftCardsData = giftCardsRes.ok ? await giftCardsRes.json() : [];
  const usersData = usersRes.ok ? await usersRes.json() : [];
  
  // === FULL DEBUG CODE ===
  console.log("🔍 DEBUG: Raw orders data:", ordersData.length);

  const testOrder = ordersData.find(order => 
    order.customerInfo?.firstName === 'momotest1234' || 
    order.customerInfo?.phone === '5103285550'
  );
  
  if (testOrder) {
    console.log("🎯 FOUND TEST ORDER:", {
      id: testOrder._id || testOrder.id,
      status: testOrder.status,
      total: testOrder.total,
      finalTotal: testOrder.finalTotal,
      createdAt: testOrder.createdAt,
      franchiseId: testOrder.franchiseId,
      locationId: testOrder.locationId
    });

// Check if this order passes filtering
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - Number(filter));

let orderDate;
if (testOrder.createdAt?.toDate) {
  orderDate = testOrder.createdAt.toDate();
} else if (testOrder.createdAt) {
  orderDate = new Date(testOrder.createdAt);
}

console.log("🔍 Filter cutoff:", cutoff.toISOString());

// 🔥 FIX: Handle invalid dates safely
try {
  if (orderDate && !isNaN(orderDate.getTime())) {
    console.log("🔍 Order date:", orderDate.toISOString());
    console.log("🔍 Order passes date filter:", orderDate >= cutoff);
  } else {
    console.log("🔍 Order date: INVALID", testOrder.createdAt);
    console.log("🔍 Order passes date filter: UNKNOWN (invalid date)");
  }
} catch (error) {
  console.log("🔍 Order date ERROR:", error.message);
  console.log("🔍 Raw createdAt value:", testOrder.createdAt);
}
    
  } else {
    console.log("❌ TEST ORDER NOT FOUND in fetched data");
  }
  
  // Check the status of your most recent orders
  const recentOrders = ordersData.slice(-10);
  console.log("🔍 DEBUG: Last 10 orders:", recentOrders.map(order => ({
    id: order._id || order.id,
    status: order.status,
    total: order.total,
    finalTotal: order.finalTotal,
    originalTotal: order.originalTotal,
    createdAt: order.createdAt,
    completedAt: order.completedAt
  })));

  // Check all unique statuses in your database
  const allStatuses = [...new Set(ordersData.map(o => o.status))];
  console.log("🔍 DEBUG: All order statuses found:", allStatuses);

  // Count orders by status
  const statusCounts = ordersData.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  console.log("🔍 DEBUG: Orders by status:", statusCounts);

  // Check what the revenue calculation actually sees
  const confirmedOrders = ordersData.filter(o => ["completed", "confirmed", "paid"].includes(o.status));
  console.log("🔍 DEBUG: Confirmed/completed orders:", confirmedOrders.length);

  if (confirmedOrders.length > 0) {
    const sampleOrder = confirmedOrders[0];
    console.log("🔍 DEBUG: Sample order structure:", {
      id: sampleOrder._id || sampleOrder.id,
      status: sampleOrder.status,
      total: sampleOrder.total,
      finalTotal: sampleOrder.finalTotal,
      originalTotal: sampleOrder.originalTotal,
      allKeys: Object.keys(sampleOrder)
    });
  }

  // Test revenue calculation manually
  const testRevenue = confirmedOrders.reduce((sum, o) => {
    const total = parseFloat(o.total || o.finalTotal || 0);
    console.log(`Order ${o.id}: status=${o.status}, total=${total}`);
    return sum + total;
  }, 0);
  console.log("🔍 DEBUG: Manual revenue calculation:", testRevenue);

  // Check if filtering is the issue
  console.log("🔍 DEBUG: Filter setting:", filter);
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(filter));
  console.log("🔍 DEBUG: Filter cutoff date:", cutoff.toISOString());
  
  const ordersAfterCutoff = ordersData.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= cutoff;
  });
  console.log("🔍 DEBUG: Orders after filter cutoff:", ordersAfterCutoff.length);
  
  console.log("🔍 Analytics Data Loaded:", {
    orders: ordersData.length,
    privateDining: privateDiningData.length,
    events: eventsData.length,
    giftCards: giftCardsData.length,
    users: usersData.length,
  });
  
  setOrders(ordersData);
  setReservations(reservationsData);
  setPrivateDining(privateDiningData);
  setEvents(eventsData);
  setGiftCards(giftCardsData);
  setUsers(usersData);
} catch (err) {
  console.error("❌ Analytics fetch error:", err);
} finally {
  setLoading(false);
}


};

const daysAgo = (days) => {
const date = new Date();
date.setDate(date.getDate() - days);
return date;
};

// REPLACE your getFilteredData function with this safer version:

const getFilteredData = (data, field = "createdAt") => {
  if (filter === "All") return data;
  const cutoff = daysAgo(Number(filter));

  return data.filter((item) => {
    const dateValue = item[field];

    try {
      let itemDate;

      if (dateValue?.toDate) {
        itemDate = dateValue.toDate();
      } else if (dateValue?._seconds) {
        itemDate = new Date(dateValue._seconds * 1000);
      } else if (dateValue) {
        itemDate = new Date(dateValue);
      } else {
        return filter === "All";
      }

      if (isNaN(itemDate.getTime())) return filter === "All";

      return itemDate >= cutoff;
    } catch (error) {
      console.error("❌ Filter error:", error);
      return filter === "All";
    }
  });
};

const filteredOrders = getFilteredData(orders);
const filteredReservations = getFilteredData(reservations);
const filteredPrivateDining = getFilteredData(privateDining, "eventDate");
const filteredEvents = getFilteredData(events, "date");
const filteredGiftCards = getFilteredData(giftCards);
console.log("🔍 Orders after filtering:", filteredOrders.length);
console.log("🔍 Sample filtered order:", filteredOrders[0]);

// 🔥 ADD THIS DEBUG LINE HERE:
console.log("🎁 DEBUG: Gift card filtering:", {
  originalGiftCards: giftCards.length,
  filteredGiftCards: filteredGiftCards.length,
  filter: filter,
  sampleOriginalCard: giftCards[0],
  sampleFilteredCard: filteredGiftCards[0]
});

console.log("🔍 Orders after filtering:", filteredOrders.length);
console.log("🔍 Sample filtered order:", filteredOrders[0]);

// REPLACE your calculateOrderRevenue function with this expanded version:
const calculateOrderRevenue = (ordersList) => {
  console.log("💰 Calculating revenue for", ordersList.length, "orders");

  const testOrder = ordersList.find(order =>
    order.customerInfo?.firstName === 'momotest1234' ||
    order.customerName?.includes('momotest')
  );

  if (testOrder) {
    console.log("💰 Test order IS in revenue calculation:", {
      id: testOrder.id || testOrder._id,
      status: testOrder.status,
      total: testOrder.total || testOrder.finalTotal,
      willBeIncluded: ["completed", "confirmed", "paid"].includes(testOrder.status),
      createdAt: testOrder.createdAt
    });

    console.log("🔥 EXACT STATUS CHECK:", {
      actualStatus: `"${testOrder.status}"`,
      statusType: typeof testOrder.status,
      completedMatch: testOrder.status === "completed",
      confirmedMatch: testOrder.status === "confirmed", 
      paidMatch: testOrder.status === "paid",
      includesCheck: ["completed", "confirmed", "paid"].includes(testOrder.status)
    });
  } else {
    console.log("❌ Test order NOT in revenue calculation list");
    const sampleOrders = ordersList.slice(0, 3).map(o => ({
      id: o.id || o._id,
      customer: o.customerInfo?.firstName || o.customerName,
      status: o.status,
      total: o.total || o.finalTotal
    }));
    console.log("💰 Sample orders in calculation:", sampleOrders);
  }

  const allStatusesInList = [...new Set(ordersList.map(o => o.status))];
  console.log("💰 All statuses in revenue calculation:", allStatusesInList);

  const statusCounts = ordersList.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  console.log("💰 Orders by status in calculation:", statusCounts);

  const revenue = ordersList.reduce((sum, o) => {
    const isIncluded = ["completed", "confirmed", "paid"].includes(o.status);
    if (isIncluded) {
      const total = parseFloat(o.finalTotal || o.total || o.originalTotal || 0);

      if (o.customerInfo?.firstName === 'momotest1234' || o.customerName?.includes('momotest')) {
        console.log("💰 INCLUDING TEST ORDER:", {
          id: o.id || o._id,
          status: o.status,
          finalTotal: o.finalTotal,
          total: o.total,
          originalTotal: o.originalTotal,
          calculatedTotal: total
        });
      }

      return sum + total;
    }
    return sum;
  }, 0);

  console.log("💰 Final calculated revenue:", revenue);
  return revenue;
};
const calculatePrivateDiningRevenue = (pdList) =>
  pdList.reduce(
    (sum, pd) =>
      ["confirmed", "completed"].includes(pd.status) ? sum + parseFloat(pd.totalAmount || 0) : sum,
    0
  );

const calculateEventRevenue = (evts) =>
  evts.reduce(
    (sum, e) =>
      e.status === "completed" ? sum + parseFloat(e.ticketPrice || 0) * (e.ticketsSold || 0) : sum,
    0
  );

const calculateGiftCardRevenue = (list) => {
const sales = list.reduce((sum, g) => sum + parseFloat(g.amount || 0), 0);
const redeemed = list.reduce((sum, g) => {
const remaining = parseFloat(g.remainingAmount || 0);
const original = parseFloat(g.amount || 0);
return sum + (original - remaining);
}, 0);
return { sales, redeemed, outstanding: sales - redeemed };
};

// ✅ Enhanced Gift Card Metrics Calculation
const calculateEnhancedGiftCardMetrics = (giftCardList) => {
  console.log("🎁 Calculating gift card metrics for", giftCardList.length, "cards");

  if (giftCardList.length === 0) {
    return {
      totalSales: 0,
      totalRedeemed: 0,
      outstanding: 0,
      breakageRevenue: 0,
      fullyRedeemedCount: 0,
      partiallyRedeemedCount: 0,
      unredeemedCount: 0,
      avgGiftCardValue: 0,
      redemptionRate: 0,
      dailySales: {},
      valueRanges: { "$0-25": 0, "$26-50": 0, "$51-100": 0, "$101+": 0 },
      totalCount: 0,
    };
  }

  const totalSales = giftCardList.reduce((sum, g) => sum + parseFloat(g.amount || 0), 0);

  const totalRedeemed = giftCardList.reduce((sum, g) => {
    const original = parseFloat(g.amount || 0);
    const remaining = parseFloat(g.remainingAmount ?? g.amount ?? 0);
    return sum + (original - remaining);
  }, 0);

  const fullyRedeemedCount = giftCardList.filter(g => {
    const remaining = parseFloat(g.remainingAmount ?? g.amount ?? 0);
    return remaining === 0 || g.redeemed === true;
  }).length;

  const partiallyRedeemedCount = giftCardList.filter(g => {
    const original = parseFloat(g.amount || 0);
    const remaining = parseFloat(g.remainingAmount ?? g.amount ?? 0);
    return remaining < original && remaining > 0;
  }).length;

  const unredeemedCount = giftCardList.filter(g => {
    const original = parseFloat(g.amount || 0);
    const remaining = parseFloat(g.remainingAmount ?? g.amount ?? 0);
    return remaining === original;
  }).length;

  const avgGiftCardValue = totalSales / giftCardList.length;
  const redemptionRate = ((fullyRedeemedCount + partiallyRedeemedCount) / giftCardList.length) * 100;
  const outstanding = totalSales - totalRedeemed;

  // Detect gift cards with unused value older than 2 years (breakage revenue)
  const breakageRevenue = giftCardList.filter(g => {
    try {
      let created;
      if (g.createdAt?.toDate) {
        created = g.createdAt.toDate();
      } else if (g.createdAt?._seconds) {
        created = new Date(g.createdAt._seconds * 1000);
      } else if (g.createdAt) {
        created = new Date(g.createdAt);
      } else {
        return false;
      }

      const age = new Date() - created;
      const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
      return age > twoYears && parseFloat(g.remainingAmount ?? g.amount ?? 0) > 0;
    } catch (err) {
      return false;
    }
  }).reduce((sum, g) => sum + parseFloat(g.remainingAmount ?? g.amount ?? 0), 0);

  // Daily sales histogram
  const dailySales = {};
  giftCardList.forEach(card => {
    try {
      let date;
      if (card.createdAt?.toDate) {
        date = card.createdAt.toDate().toISOString().split("T")[0];
      } else if (card.createdAt?._seconds) {
        date = new Date(card.createdAt._seconds * 1000).toISOString().split("T")[0];
      } else if (card.createdAt) {
        date = new Date(card.createdAt).toISOString().split("T")[0];
      } else {
        console.warn("Gift card missing createdAt:", card.id);
        return;
      }

      dailySales[date] = (dailySales[date] || 0) + parseFloat(card.amount || 0);
    } catch (err) {
      console.warn("Invalid date for gift card:", card.id, err);
    }
  });

  const valueRanges = {
    "$0-25": giftCardList.filter(g => parseFloat(g.amount || 0) <= 25).length,
    "$26-50": giftCardList.filter(g => parseFloat(g.amount || 0) > 25 && parseFloat(g.amount || 0) <= 50).length,
    "$51-100": giftCardList.filter(g => parseFloat(g.amount || 0) > 50 && parseFloat(g.amount || 0) <= 100).length,
    "$101+": giftCardList.filter(g => parseFloat(g.amount || 0) > 100).length,
  };

  console.log("✅ Gift card metrics calculated:", {
    totalSales,
    totalRedeemed,
    outstanding,
    fullyRedeemedCount,
    partiallyRedeemedCount,
    unredeemedCount,
    avgGiftCardValue,
    redemptionRate,
    dailySalesKeys: Object.keys(dailySales).length,
    totalCount: giftCardList.length,
  });

  return {
    totalSales,
    totalRedeemed,
    outstanding,
    breakageRevenue,
    fullyRedeemedCount,
    partiallyRedeemedCount,
    unredeemedCount,
    avgGiftCardValue,
    redemptionRate,
    dailySales,
    valueRanges,
    totalCount: giftCardList.length,
  };
};

// ✅ Get Formatted Gift Card Sales Chart Data (last 14 days)
const getGiftCardDailySales = (metrics) => {
  const { dailySales } = metrics;

  const sortedDates = Object.keys(dailySales).sort();
  const last14Days = sortedDates.slice(-14);

  const labels = last14Days.map(date => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  });

  const data = last14Days.map(date => dailySales[date] || 0);

  console.log("📊 Gift card chart data:", { labels, data });

  return { labels, data };
};

const analyzeCustomers = () => {
const loyal = users.filter((u) => u.orderCount > 0);
const loyalRevenue = loyal.reduce((sum, u) => sum + (u.totalSpent || 0), 0);
const guestOrders = filteredOrders.filter((o) => o.customerType === "guest" || !o.customerId);
const guestRevenue = calculateOrderRevenue(guestOrders);
return {
loyalCustomers: loyal.length,
loyalRevenue,
avgLoyalSpending: loyal.length > 0 ? loyalRevenue / loyal.length : 0,
guestRevenue,
totalCustomerRevenue: loyalRevenue + guestRevenue,
};
};

const orderRevenue = calculateOrderRevenue(filteredOrders);
const privateDiningRevenue = calculatePrivateDiningRevenue(filteredPrivateDining);
const eventRevenue = calculateEventRevenue(filteredEvents);
const giftCardMetrics = calculateGiftCardRevenue(filteredGiftCards);
const enhancedGiftCardMetrics = calculateEnhancedGiftCardMetrics(filteredGiftCards);
const customerAnalysis = analyzeCustomers();

const totalRevenue = orderRevenue + privateDiningRevenue + eventRevenue + giftCardMetrics.sales;
const avgOrderValue = filteredOrders.length > 0 ? orderRevenue / filteredOrders.length : 0;
const avgPrivateDiningValue = filteredPrivateDining.length > 0 ? privateDiningRevenue / filteredPrivateDining.length : 0;

const revenueBySource = {
  "Food Orders": orderRevenue,
  "Private Dining": privateDiningRevenue,
  "Gift Card Sales": giftCardMetrics.sales,
  Events: eventRevenue,
};

const customerBreakdown = {
  "Loyal Customers": customerAnalysis.loyalRevenue,
  "Guest Orders": customerAnalysis.guestRevenue,
};

const orderTypeBreakdown = filteredOrders.reduce((acc, order) => {
  const type = order.orderType || "Unknown";
  acc[type] = (acc[type] || 0) + 1;
  return acc;
}, {});

const reservationStatus = filteredReservations.reduce((acc, res) => {
  const status = res.status || "Unknown";
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

const getDailyRevenueTrend = () => {
  const totals = {};

  filteredOrders.forEach((o) => {
    if (["completed", "confirmed", "paid"].includes(o.status)) {
      let date;
      try {
        if (o.createdAt?.toDate) {
          date = o.createdAt.toDate().toISOString().split("T")[0];
        } else if (o.createdAt?._seconds) {
          date = new Date(o.createdAt._seconds * 1000).toISOString().split("T")[0];
        } else if (o.createdAt) {
          const parsedDate = new Date(o.createdAt);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split("T")[0];
          }
        }

        if (date) {
          const total = parseFloat(o.finalTotal || o.total || o.originalTotal || 0);
          totals[date] = (totals[date] || 0) + total;

          if (
            o.customerInfo?.firstName === "momotest1234" ||
            o.customerName?.includes("momotest")
          ) {
            console.log("📈 Test order added to daily trend:", {
              date,
              total,
              runningTotal: totals[date],
            });
          }
        }
      } catch (error) {
        console.warn("Invalid date for order:", o.id, error);
      }
    }
  });

  filteredPrivateDining.forEach((pd) => {
    if (["confirmed", "completed"].includes(pd.status)) {
      let date;
      try {
        if (pd.eventDate?.toDate) {
          date = pd.eventDate.toDate().toISOString().split("T")[0];
        } else if (pd.eventDate?._seconds) {
          date = new Date(pd.eventDate._seconds * 1000).toISOString().split("T")[0];
        } else if (pd.eventDate) {
          const parsedDate = new Date(pd.eventDate);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split("T")[0];
          }
        }

        if (date) {
          totals[date] = (totals[date] || 0) + parseFloat(pd.totalAmount || 0);
        }
      } catch (error) {
        console.warn("Invalid date for private dining:", pd.id, error);
      }
    }
  });

  const sorted = Object.keys(totals).sort().slice(-14);
  const result = Object.fromEntries(sorted.map((d) => [d, totals[d]]));

  console.log("📈 Daily revenue trend data:", result);
  return result;
};

const dailyRevenue = getDailyRevenueTrend();

const loyaltyTierRevenue = () => {
const tiers = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
users.forEach((u) => {
if (u.totalSpent > 0) tiers[u.tier] += u.totalSpent;
});
return tiers;
};

const tierRevenue = loyaltyTierRevenue();

// Auto-load data when component mounts or dependencies change
useEffect(() => {
fetchAnalyticsData();
}, [selectedFranchise, selectedLocation]);

useEffect(() => {
if (shouldRefresh) {
fetchAnalyticsData();
setShouldRefresh(false);
}
}, [shouldRefresh]);

if (loading) {
return <div className="analytics-panel"><p>Loading premium analytics…</p></div>;
}

if (EMERGENCY_MODE) {
return (
<div className="analytics-panel">
<h2>⚠️ Analytics Temporarily Disabled</h2>
<p>Daily read limit exceeded. Will be back tomorrow at midnight PT.</p>
</div>
);
}
return (
  <div className="analytics-panel">
    <h2>📊 Premium Analytics Dashboard</h2>
    <button onClick={() => setShouldRefresh(true)} className="refresh-btn">
      🔄 Refresh Data
    </button>

    <div className="calendar-controls">
      <label>Time Range:</label>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 90 Days</option>
        <option value="All">All Time</option>
      </select>
    </div>

    {(isSuperAdmin || selectedFranchise?._id) ? (
    <>
      {/* Revenue Summary Cards */}
      <div className="stat-grid">
        <div className="stat-card revenue-card">
          <h4>💰 Total Revenue</h4>
          <p className="stat-value">${totalRevenue.toFixed(2)}</p>
          <div className="revenue-breakdown">
            <small>Orders: ${orderRevenue.toFixed(2)} ({totalRevenue > 0 ? ((orderRevenue/totalRevenue)*100).toFixed(1) : 0}%)</small>
            <small>Private: ${privateDiningRevenue.toFixed(2)} ({totalRevenue > 0 ? ((privateDiningRevenue/totalRevenue)*100).toFixed(1) : 0}%)</small>
            <small>Gift Cards: ${giftCardMetrics.sales.toFixed(2)} ({totalRevenue > 0 ? ((giftCardMetrics.sales/totalRevenue)*100).toFixed(1) : 0}%)</small>
            <small>Events: ${eventRevenue.toFixed(2)} ({totalRevenue > 0 ? ((eventRevenue/totalRevenue)*100).toFixed(1) : 0}%)</small>
          </div>
        </div>

        <div className="stat-card">
          <h4>🛒 Orders</h4>
          <p className="stat-value">{filteredOrders.length}</p>
          <small>Revenue: ${orderRevenue.toFixed(2)} | Avg: ${avgOrderValue.toFixed(2)}</small>
        </div>

        <div className="stat-card">
          <h4>🍽️ Private Dining</h4>
          <p className="stat-value">{filteredPrivateDining.length}</p>
          <small>Revenue: ${privateDiningRevenue.toFixed(2)} | Avg: ${avgPrivateDiningValue.toFixed(2)}</small>
        </div>
        <div className="stat-card giftcard-detailed">
  <h4>🎁 Gift Card Performance</h4>
  {enhancedGiftCardMetrics.totalCount > 0 ? (
    <div className="giftcard-metrics">
      <div className="metric-row">
        <strong>Total Sales:</strong> ${enhancedGiftCardMetrics.totalSales.toFixed(2)}
      </div>
      <div className="metric-row">
        <strong>Redeemed:</strong> ${enhancedGiftCardMetrics.totalRedeemed.toFixed(2)}
        <span className="percentage">
          ({enhancedGiftCardMetrics.totalSales > 0
            ? ((enhancedGiftCardMetrics.totalRedeemed / enhancedGiftCardMetrics.totalSales) * 100).toFixed(1)
            : 0}%)
        </span>
      </div>
      <div className="metric-row">
        <strong>Outstanding:</strong> ${enhancedGiftCardMetrics.outstanding.toFixed(2)}
      </div>
      <div className="metric-row">
        <strong>Avg Value:</strong> ${enhancedGiftCardMetrics.avgGiftCardValue.toFixed(2)}
      </div>
      <div className="metric-row">
        <strong>Redemption Rate:</strong> {enhancedGiftCardMetrics.redemptionRate.toFixed(1)}%
      </div>
      <div className="metric-row">
        <strong>Cards Sold:</strong> {enhancedGiftCardMetrics.totalCount}
      </div>
      <div className="metric-row">
        <strong>Breakage Revenue:</strong> ${enhancedGiftCardMetrics.breakageRevenue.toFixed(2)}
      </div>
    </div>
  ) : (
    <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
      <p>No gift cards found</p>
      <small>Gift cards will appear here once purchased</small>
    </div>
  )}
</div>
  
        <div className="stat-card">
          <h4>👥 Customer Analysis</h4>
          <p className="stat-value">{customerAnalysis.loyalCustomers}</p>
          <small>
            Loyal Revenue: ${customerAnalysis.loyalRevenue.toFixed(2)} | 
            Guest Revenue: ${customerAnalysis.guestRevenue.toFixed(2)}
          </small>
        </div>

        <div className="stat-card">
          <h4>🎫 Events</h4>
          <p className="stat-value">{filteredEvents.length}</p>
          <small>Revenue: ${eventRevenue.toFixed(2)}</small>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="chart-grid">
        {/* Daily Revenue Trend */}
        <div className="chart-card">
          <h3>📈 Daily Revenue Trend</h3>
          <Line
            data={{
              labels: Object.keys(dailyRevenue),
              datasets: [
                {
                  label: "Total Revenue ($)",
                  data: Object.values(dailyRevenue),
                  borderColor: "#2ecc71",
                  backgroundColor: "rgba(46, 204, 113, 0.1)",
                  tension: 0.4,
                  fill: true
                }
              ]
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { callback: (value) => "$" + value.toFixed(0) }
                }
              }
            }}
          />
        </div>
        {/* Gift Card Sales Trend */}
<div className="chart-card">
<h3>🎁 Gift Card Sales Trend</h3>
  {(() => {
    const giftCardChartData = getGiftCardDailySales(enhancedGiftCardMetrics);
    
    return (
      <Line
        data={{
          labels: giftCardChartData.labels,
          datasets: [
            {
              label: "Gift Card Sales ($)",
              data: giftCardChartData.data,
              borderColor: "#f39c12",
              backgroundColor: "rgba(243, 156, 18, 0.1)",
              tension: 0.4,
              fill: true
            }
          ]
        }}
        options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (value) => "$" + value.toFixed(0) }
            }
          }
        }}
      />
    );
  })()}
</div>

{/* Gift Card Redemption Status */}
<div className="chart-card">
  <h3>💳 Gift Card Redemption Status</h3>
  <Doughnut
    data={{
      labels: ["Fully Redeemed", "Partially Redeemed", "Unredeemed"],
      datasets: [
        {
          data: [
            enhancedGiftCardMetrics.fullyRedeemedCount,
            enhancedGiftCardMetrics.partiallyRedeemedCount,
            enhancedGiftCardMetrics.unredeemedCount
          ],
          backgroundColor: ["#2ecc71", "#f39c12", "#e74c3c"],
          borderWidth: 2,
          borderColor: "#fff"
        }
      ]
    }}
    options={{
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = enhancedGiftCardMetrics.totalCount;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} cards (${percentage}%)`;
            }
          }
        }
      }
    }}
  />
</div>

{/* Gift Card Value Distribution */}
<div className="chart-card">
  <h3>💰 Gift Card Value Distribution</h3>
  <Bar
    data={{
      labels: Object.keys(enhancedGiftCardMetrics.valueRanges),
      datasets: [
        {
          label: "Number of Cards",
          data: Object.values(enhancedGiftCardMetrics.valueRanges),
          backgroundColor: ["#3498db", "#2ecc71", "#f39c12", "#e74c3c"],
          borderWidth: 1
        }
      ]
    }}
    options={{
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }}
  />
</div>

        {/* Revenue by Source */}
        <div className="chart-card">
          <h3>💰 Revenue by Source</h3>
          <Doughnut
            data={{
              labels: Object.keys(revenueBySource),
              datasets: [
                {
                  data: Object.values(revenueBySource),
                  backgroundColor: ["#3498db", "#e74c3c", "#f39c12", "#9b59b6"],
                  borderWidth: 2,
                  borderColor: "#fff"
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const value = context.parsed;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>

        {/* Customer Revenue Split */}
        <div className="chart-card">
          <h3>👥 Customer Revenue Split</h3>
          <Doughnut
            data={{
              labels: Object.keys(customerBreakdown),
              datasets: [
                {
                  data: Object.values(customerBreakdown),
                  backgroundColor: ["#2ecc71", "#34495e"],
                  borderWidth: 2,
                  borderColor: "#fff"
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const value = context.parsed;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>

        {/* Loyalty Tier Revenue */}
        <div className="chart-card">
          <h3>🏆 Revenue by Loyalty Tier</h3>
          <Bar
            data={{
              labels: Object.keys(tierRevenue),
              datasets: [
                {
                  label: "Revenue ($)",
                  data: Object.values(tierRevenue),
                  backgroundColor: ["#cd7f32", "#c0c0c0", "#ffd700", "#e5e4e2"],
                  borderWidth: 1
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { callback: (value) => "$" + value.toFixed(0) }
                }
              }
            }}
          />
        </div>

        {/* Order Types */}
        <div className="chart-card">
          <h3>🚚 Order Types</h3>
          <Doughnut
            data={{
              labels: Object.keys(orderTypeBreakdown),
              datasets: [
                {
                  data: Object.values(orderTypeBreakdown),
                  backgroundColor: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12"],
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: "bottom" } },
            }}
          />
        </div>

        {/* Reservation Status */}
        <div className="chart-card">
          <h3>📋 Reservation Status</h3>
          <Bar
            data={{
              labels: Object.keys(reservationStatus),
              datasets: [
                {
                  label: "Reservations",
                  data: Object.values(reservationStatus),
                  backgroundColor: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12"],
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      </div>

      {/* Executive Summary */}
      <div className="data-summary">
        <h3>📊 Executive Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>Total Revenue:</strong> ${totalRevenue.toLocaleString()}
          </div>
          <div className="summary-item">
            <strong>Primary Revenue Source:</strong> Food Orders (${orderRevenue.toLocaleString()})
          </div>
          <div className="summary-item">
            <strong>Average Order Value:</strong> ${avgOrderValue.toFixed(2)}
          </div>
          <div className="summary-item">
            <strong>Loyal Customers:</strong> {customerAnalysis.loyalCustomers} (${customerAnalysis.loyalRevenue.toLocaleString()} revenue)
          </div>
          <div className="summary-item">
            <strong>Gift Card Performance:</strong> ${giftCardMetrics.sales.toLocaleString()} sold, {giftCardMetrics.sales > 0 ? ((giftCardMetrics.redeemed/giftCardMetrics.sales)*100).toFixed(1) : 0}% redeemed
          </div>
          <div className="summary-item">
            <strong>Private Dining:</strong> {filteredPrivateDining.length} events, ${privateDiningRevenue.toLocaleString()} revenue
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="no-data-message">
      <h3>🏢 Select a Franchise</h3>
      <p>
       {isSuperAdmin
        ? "Please select a franchise from the dropdown to view premium analytics data."
        :"Please wait while we load your franchise data ..."
       }
       </p>
       {isSuperAdmin && (
        <small> Use the 🏢 button in the top-right to choose a franchise or location.</small>
       )}
    </div>
  )}
</div>

);
};

export default AnalyticsPanel;
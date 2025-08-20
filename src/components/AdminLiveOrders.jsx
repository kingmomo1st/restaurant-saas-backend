import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import Papa from "papaparse";
import "./css/AdminLiveOrders.css";

const AdminLiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState(null); // 🔥 ADD: Error state

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();

  const getSafeDate = (dateValue) => {
    try {
      if (dateValue?.toDate) return dateValue.toDate();
      if (dateValue?._seconds) return new Date(dateValue._seconds * 1000);
      if (dateValue) {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    } catch (error) {
      console.warn("Invalid date:", dateValue, error);
      return null;
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null); // 🔥 CLEAR previous errors

    try {
      const params = new URLSearchParams();

      // 🔥 ENHANCED: Better parameter handling
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
        console.log(`🔍 Using franchise filter: ${selectedFranchise._id}`);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
        console.log(`🔍 Using location filter: ${selectedLocation._id}`);
      }

      console.log(`🔍 Fetching live orders with params: ${params.toString()}`);

      const response = await fetch(`/api/live-orders?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ Live Orders: Fetched ${data.length} recent orders`);

      // 🔥 DEBUG: Check what we got
      if (data.length > 0) {
        console.log("🔍 Sample orders:", data.slice(0, 3).map(order => ({
          id: order.id,
          customer: order.customerName,
          status: order.status,
          total: order.total
        })));
      }

      setOrders(data);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching live orders:", err);
      setError(err.message);
      toast.error(`Failed to fetch orders: ${err.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Updating order ${orderId} to ${newStatus}`);

      const response = await fetch(`/api/live-orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }

      toast.success(`Order updated to "${newStatus}"`);
      fetchOrders(); // Refresh data
    } catch (err) {
      console.error("Update error:", err);
      toast.error(`Failed to update order: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedFranchise, selectedLocation]);

  useEffect(() => {
    let result = [...orders];

    if (searchEmail) {
      result = result.filter((order) =>
        order.customerName?.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (filterStatus !== "All") {
      result = result.filter((order) => order.status === filterStatus);
    }

    result.sort((a, b) => {
      const aDate = getSafeDate(a.createdAt) || new Date(0);
      const bDate = getSafeDate(b.createdAt) || new Date(0);
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

    setFilteredOrders(result);

    // 🔥 DEBUG: Log filtering results
    console.log(`🔍 Filtered ${orders.length} → ${result.length} orders`);
  }, [orders, searchEmail, filterStatus, sortOrder]);

  const exportCSV = () => {
    const rows = filteredOrders.map((order) => ({
      Customer: order.customerName || "Anonymous",
      OrderType: order.orderType || "N/A",
      Total: `$${order.total || "0.00"}`,
      Status: order.status || "N/A",
      CustomerType: order.customerType || "N/A",
      Placed: (() => {
        const safeDate = getSafeDate(order.createdAt);
        return safeDate ? safeDate.toLocaleString() : "—";
      })(),
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `live_orders_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const metrics = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="admin-live-orders">
        <div className="loading-state">
          <p>Loading live orders…</p>
          <small>Fetching recent orders from the database</small>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-live-orders">
      <div className="live-orders-header">
        <h2>🔴 Live Order Management</h2>
        <div className="header-actions">
          <button onClick={fetchOrders} className="refresh-btn">
            🔄 Refresh
          </button>
          <span className="last-update">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 🔥 ADD: Error display */}
      {error && (
        <div className="error-banner" style={{
          background: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '16px',
          color: '#c62828'
        }}>
          <strong>⚠️ Connection Error:</strong> {error}
          <button 
            onClick={fetchOrders} 
            style={{marginLeft: '12px', padding: '4px 8px', fontSize: '12px'}}
          >
            Retry
          </button>
        </div>
      )}

      {isSuperAdmin || selectedFranchise ? (
        <>
          <div className="dashboard-metrics">
            <div className="metric-card"><strong>Total:</strong> {metrics.total}</div>
            <div className="metric-card pending"><strong>Pending:</strong> {metrics.pending}</div>
            <div className="metric-card confirmed"><strong>Confirmed:</strong> {metrics.confirmed}</div>
            <div className="metric-card completed"><strong>Completed:</strong> {metrics.completed}</div>
            <div className="metric-card cancelled"><strong>Cancelled:</strong> {metrics.cancelled}</div>
          </div>

          <div className="order-controls">
            <input
              type="text"
              placeholder="Search by customer name"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button onClick={exportCSV} className="export-btn">
              Export CSV ({filteredOrders.length})
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>📋 No recent orders found</h3>
              <p>No orders in the last 7 days match your current filters.</p>
              {orders.length === 0 ? (
                <small>
                  📊 Try checking the <strong>Orders</strong> tab for historical data, or ensure orders have been placed recently.
                </small>
              ) : (
                <small>
                  Found {orders.length} total orders, but none match your current filters.
                </small>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Order Type</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Customer Type</th>
                    <th>Placed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.customerName || "Anonymous"}</strong></td>
                      <td>
                        <span className={`order-type ${order.orderType}`}>
                          {order.orderType === "pickup" ? "🚶 Pickup" : "🚚 Delivery"}
                        </span>
                      </td>
                      <td><strong>${order.total || "0.00"}</strong></td>
                      <td>
                        <div className="items-summary">
                          {order.items?.length || order.cart?.length || 0} items
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status || "unknown"}
                        </span>
                      </td>
                      <td>
                        {order.customerType === "customer" ? "👤 Registered" : "👥 Guest"}
                      </td>
                      <td>
                        {(() => {
                          const safeDate = getSafeDate(order.createdAt);
                          return safeDate
                            ? formatDistanceToNow(safeDate, { addSuffix: true })
                            : "—";
                        })()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {order.status !== "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "confirmed")}
                              className="confirm-btn"
                              title="Confirm Order"
                            >
                              ✅ Confirm
                            </button>
                          )}
                          {order.status === "confirmed" && order.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "completed")}
                              className="complete-btn"
                              title="Mark Complete"
                            >
                              🎉 Complete
                            </button>
                          )}
                          {order.status !== "cancelled" && order.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "cancelled")}
                              className="cancel-btn"
                              title="Cancel Order"
                            >
                              ❌ Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="no-franchise-selected">
          <h3>🏢 Select a Franchise</h3>
          <p>Please select a franchise to view live orders.</p>
        </div>
      )}
    </div>
  );
};

export default AdminLiveOrders;
import React, { useEffect, useState } from "react";
import moment from "moment";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { saveAs } from "file-saver";
import "./css/OrderTable.css";

// Helper functions
const getCustomerName = (order) => {
  if (order.customerInfo?.firstName) {
    return `${order.customerInfo.firstName} ${order.customerInfo.lastName || ""}`.trim();
  }
  if (order.customerName) return order.customerName;
  return "Unknown Customer";
};

const getOrderTotal = (order) => {
  const total = order.finalTotal || order.total || 0;
  return parseFloat(total).toFixed(2);
};

const formatDate = (order) => {
  const dateField = order.completedAt || order.createdAt;
  if (!dateField) return "N/A";

  try {
    if (dateField._seconds) return moment(dateField._seconds * 1000).format("MMM Do, h:mm A");
    if (dateField.toDate) return moment(dateField.toDate()).format("MMM Do, h:mm A");
    return moment(dateField).format("MMM Do, h:mm A");
  } catch (error) {
    console.warn("Date formatting error:", error);
    return "Invalid Date";
  }
};

const getSafeDate = (order) => {
  const dateField = order.createdAt || order.completedAt;
  if (!dateField) return new Date(0);

  try {
    if (dateField._seconds) return new Date(dateField._seconds * 1000);
    if (dateField.toDate) return dateField.toDate();
    return new Date(dateField);
  } catch (error) {
    console.warn("Date parsing error:", error);
    return new Date(0);
  }
};

const OrdersTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    status: "completed",
    orderType: "pickup",
    total: ""
  });

  const [statusFilter, setStatusFilter] = useState("All");
  const [orderTypeFilter, setOrderTypeFilter] = useState("All");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;
  const isManager = role === "manager";
  const isStaff = role === "staff";

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }
      if (statusFilter !== "All") {
        params.append("status", statusFilter);
      }
      if (orderTypeFilter !== "All") {
        params.append("orderType", orderTypeFilter);
      }
      if (customerTypeFilter !== "All") {
        params.append("customerType", customerTypeFilter);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const sortedData = data.sort((a, b) => {
        const aDate = getSafeDate(a);
        const bDate = getSafeDate(b);
        return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
      });

      setOrders(sortedData);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orders.length > 0) {
      const sortedOrders = [...orders].sort((a, b) => {
        const aDate = getSafeDate(a);
        const bDate = getSafeDate(b);
        return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
      });
      setOrders(sortedOrders);
    }
  }, [sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [selectedFranchise, selectedLocation, statusFilter, orderTypeFilter, customerTypeFilter]);

  const handleEdit = (order) => {
    if (isStaff) return;
    setEditingId(order.id);
    setEditFormData({
      customerName: getCustomerName(order),
      status: order.status || "completed",
      orderType: order.orderType || "pickup",
      total: getOrderTotal(order)
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/orders/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setEditingId(null);
      fetchOrders();
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order");
    }
  };

  const handleDelete = async (id) => {
    if (isStaff) return;
    if (!window.confirm("Delete this order?")) return;

    try {
      const response = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      fetchOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Failed to delete order");
    }
  };

  const exportCSV = () => {
    const headers = ["Customer", "Order Type", "Total", "Status", "Customer Type", "Created At"];
    const rows = orders.map((order) => [
      getCustomerName(order),
      order.orderType || "N/A",
      `$${getOrderTotal(order)}`,
      order.status || "N/A",
      order.customerType || "guest",
      formatDate(order)
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const timestamp = moment().format("YYYYMMDD_HHmmss");
    const filename = `orders_export_${timestamp}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Loading orders…</div>;
  }

  return (
    <div>
      <div className="filter-controls" style={{ marginBottom: "20px", display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Filters */}
        <div>
          <label>Status: </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="completed">Completed</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label>Order Type: </label>
          <select value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <div>
          <label>Customer Type: </label>
          <select value={customerTypeFilter} onChange={(e) => setCustomerTypeFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="customer">Registered Customer</option>
            <option value="guest">Guest</option>
          </select>
        </div>
        <div>
          <label>Sort: </label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        <div>
          <label>Search Customer: </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name…"
            style={{ padding: "5px", marginLeft: "5px" }}
          />
        </div>
        <button onClick={exportCSV} className="export-btn">Export CSV ({orders.length} records)</button>
        <button onClick={fetchOrders} className="refresh-btn">🔄 Refresh</button>
      </div>

      {/* Order Table */}
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <h3>🛒 No orders found</h3>
          <p>Check your filters or try refreshing the data.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Order Type</th>
              <th>Total</th>
              <th>Status</th>
              <th>Customer Type</th>
              <th>Items</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.filter(order =>
              searchTerm === "" || getCustomerName(order).toLowerCase().includes(searchTerm.toLowerCase())
            ).map(order => (
              <tr key={order.id}>
                {editingId === order.id ? (
                  <>
                    <td>
                      <input
                        value={editFormData.customerName}
                        onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={editFormData.orderType}
                        onChange={(e) => setEditFormData({ ...editFormData, orderType: e.target.value })}
                      >
                        <option value="pickup">Pickup</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.total}
                        onChange={(e) => setEditFormData({ ...editFormData, total: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      >
                        <option value="completed">Completed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <button className="save-btn" onClick={handleSave}>Save</button>
                      <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{getCustomerName(order)}</td>
                    <td>{order.orderType || "N/A"}</td>
                    <td>${getOrderTotal(order)}</td>
                    <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                    <td>{order.customerType || "guest"}</td>
                    <td>{order.cart?.length || order.items?.length || 0} items</td>
                    <td>{formatDate(order)}</td>
                    <td>
                      {isSuperAdmin || role === "admin" || isManager ? (
                        <>
                          <button className="edit-btn" onClick={() => handleEdit(order)}>Edit</button>
                          <button className="cancel-btn" onClick={() => handleDelete(order.id)}>Delete</button>
                        </>
                      ) : (
                        <span style={{ color: "#999" }}>Restricted</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrdersTable;
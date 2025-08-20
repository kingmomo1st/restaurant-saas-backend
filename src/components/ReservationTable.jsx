import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/ReservationTable.css";

// 🔥 HELPER FUNCTIONS TO HANDLE FIELD MAPPING
const getCustomerName = (reservation) => {
  return reservation.customerName || reservation.name || "N/A";
};

const getCustomerEmail = (reservation) => {
  return reservation.customerEmail || reservation.email || "N/A";
};

const getCustomerPhone = (reservation) => {
  return reservation.customerPhone || reservation.phone || "N/A";
};

const getReservationDate = (reservation) => {
  try {
    if (!reservation.date) return "N/A";


// Handle Firestore Timestamps
if (reservation.date.toDate) {
  return format(reservation.date.toDate(), "yyyy-MM-dd");
}

// Handle raw Firestore timestamps with _seconds
if (reservation.date._seconds) {
  return format(new Date(reservation.date._seconds * 1000), "yyyy-MM-dd");
}

// Handle ISO strings
if (typeof reservation.date === "string") {
  return format(new Date(reservation.date), "yyyy-MM-dd");
}

return "N/A";


} catch (error) {
  console.warn("Date formatting error:", error);
  return "N/A";
}
};
const getFormattedDateTime = (reservation) => {
  try {
    if (!reservation.createdAt) return "N/A";
  

// Handle Firestore Timestamps
if (reservation.createdAt.toDate) {
  return format(reservation.createdAt.toDate(), "yyyy-MM-dd HH:mm");
}

// Handle raw Firestore timestamps
if (reservation.createdAt._seconds) {
  return format(new Date(reservation.createdAt._seconds * 1000), "yyyy-MM-dd HH:mm");
}

// Handle ISO strings
return format(new Date(reservation.createdAt), "yyyy-MM-dd HH:mm");

} catch (error) {
  console.warn("DateTime formatting error:", error);
  return "N/A";
}
};

const ReservationTable = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");

  const [editFormData, setEditFormData] = useState({
    customerName: "",
    date: "",
    time: "",
    guests: 2,
    status: "confirmed",
    notes: "",
    phone: "",
    email: "",
  });

const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
const selectedLocation = useSelector((state) => state.location.selectedLocation);
const { isSuperAdmin, user } = useAuth();
const role = user?.role;
const isManager = role === "manager";
const canEdit = role === "admin" || isManager || isSuperAdmin;
const canDelete = role === "admin" || isSuperAdmin;

const fetchReservations = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (selectedFranchise?._id && !isSuperAdmin) {
      params.append("franchiseId", selectedFranchise._id);
    }
    if (selectedLocation?._id) {
      params.append("locationId", selectedLocation._id);
    }


  const response = await fetch(`/api/reservations?${params.toString()}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = await response.json();
  console.log(`✅ Reservations: Fetched ${data.length} reservations`);
  setReservations(data);
} catch (err) {
  console.error("❌ Error fetching reservations:", err);
  setReservations([]);
  toast.error("Failed to fetch reservations");
} finally {
  setLoading(false);
}


};

const handleEdit = (reservation) => {
setEditingId(reservation.id);
setEditFormData({
customerName: getCustomerName(reservation),
date: getReservationDate(reservation),
time: reservation.time || "",
guests: reservation.guests || 2,
status: reservation.status || "confirmed",
notes: reservation.notes || "",
phone: getCustomerPhone(reservation),
email: getCustomerEmail(reservation),
});
};

const handleSave = async () => {
  if (!editFormData.customerName.trim() || !editFormData.date || !editFormData.time) {
    toast.error("Customer name, date, and time are required");
    return;
  }

try {
  const response = await fetch(`/api/reservations/${editingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...editFormData,
      updatedBy: user?.email || "Unknown",
      updatedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  toast.success("Reservation updated successfully");
  setEditingId(null);
  fetchReservations();
} catch (err) {
  console.error("❌ Error updating reservation:", err);
  toast.error("Failed to update reservation");
}


};

const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this reservation?")) return;
  
  try {
    const response = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
    toast.success("Reservation deleted successfully");
    fetchReservations();
  } catch (err) {
    console.error("❌ Error deleting reservation:", err);
    toast.error("Failed to delete reservation");
  }
  };
  
  const exportCSV = () => {
  const rows = filteredReservations.map((r) => ({
    Customer: getCustomerName(r),
    Date: getReservationDate(r),
    Time: r.time || "N/A",
    Guests: r.guests || "N/A",
    Status: r.status || "N/A",
    Type: r.customerType || "Guest",
    Phone: getCustomerPhone(r),
    Email: getCustomerEmail(r),
    Notes: r.notes || "N/A",
    Created: getFormattedDateTime(r),
  }));
  
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `reservations_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
  };
  
  useEffect(() => {
  fetchReservations();
  }, [selectedFranchise, selectedLocation]);
  
  useEffect(() => {
  let result = [...reservations];


if (searchTerm) {
  result = result.filter(
    (r) =>
      getCustomerName(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerEmail(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerPhone(r).includes(searchTerm)
  );
}

if (statusFilter !== "All") {
  result = result.filter((r) => r.status === statusFilter);
}

if (dateFilter !== "All") {
  const now = new Date();
  result = result.filter((r) => {
    try {
      if (!r.date) return false;
      
      let resDate;
      if (r.date.toDate) {
        resDate = r.date.toDate();
      } else if (r.date._seconds) {
        resDate = new Date(r.date._seconds * 1000);
      } else {
        resDate = new Date(r.date);
      }
      
      return dateFilter === "Upcoming" ? resDate >= now : resDate < now;
    } catch (error) {
      return false;
    }
  });
}

result.sort((a, b) => {
  try {
    const getDate = (item) => {
      if (item.date?.toDate) return item.date.toDate();
      if (item.date?._seconds) return new Date(item.date._seconds * 1000);
      if (item.createdAt?.toDate) return item.createdAt.toDate();
      if (item.createdAt?._seconds) return new Date(item.createdAt._seconds * 1000);
      return new Date(item.date || item.createdAt || 0);
    };

    const aDate = getDate(a);
    const bDate = getDate(b);
    return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
  } catch (error) {
    return 0;
  }
});

setFilteredReservations(result);


}, [reservations, searchTerm, statusFilter, dateFilter, sortOrder]);

const metrics = {
total: reservations.length,
confirmed: reservations.filter((r) => r.status === "confirmed").length,
pending: reservations.filter((r) => r.status === "pending").length,
cancelled: reservations.filter((r) => r.status === "cancelled").length,
totalGuests: reservations.reduce((sum, r) => sum + (r.guests || 0), 0),
};

if (loading) {
return (
<div className="reservation-table">
<p>Loading reservations…</p>
</div>
);
}

return (
<div className="reservation-table">
<div className="reservations-header">
<h2>🍽️ Reservation Management</h2>
<button onClick={fetchReservations} className="refresh-btn">
🔄 Refresh
</button>
</div>


  {!selectedFranchise ? (
    <div className="no-franchise-selected">
      <h3>🏢 Select a Franchise</h3>
      <p>Please select a franchise to view reservations.</p>
    </div>
  ) : (
    <>
      {/* Metrics */}
      <div className="dashboard-metrics">
        <div className="metric-card"><strong>Total:</strong> {metrics.total}</div>
        <div className="metric-card confirmed"><strong>Confirmed:</strong> {metrics.confirmed}</div>
        <div className="metric-card pending"><strong>Pending:</strong> {metrics.pending}</div>
        <div className="metric-card cancelled"><strong>Cancelled:</strong> {metrics.cancelled}</div>
        <div className="metric-card"><strong>Total Guests:</strong> {metrics.totalGuests}</div>
      </div>

      {/* Controls */}
      <div className="reservation-controls">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="All">All Dates</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Past">Past</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        <button onClick={exportCSV} className="export-btn">
          Export CSV ({filteredReservations.length})
        </button>
      </div>

      {/* Reservations Table */}
      {filteredReservations.length === 0 ? (
        <div className="no-reservations">
          <h3>🍽️ No reservations found</h3>
          <p>No reservations match your current filters.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Time</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map((res) => (
              <tr key={res.id}>
                {editingId === res.id ? (
                  <>
                    <td>
                      <input
                        value={editFormData.customerName}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, customerName: e.target.value })
                        }
                        placeholder="Customer name*"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editFormData.date}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, date: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={editFormData.time}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, time: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editFormData.guests}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            guests: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={editFormData.status}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, status: e.target.value })
                        }
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <div>
                        <input
                          type="email"
                          placeholder="Email"
                          value={editFormData.email}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, email: e.target.value })
                          }
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={editFormData.phone}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, phone: e.target.value })
                          }
                        />
                      </div>
                    </td>
                    <td>
                      <button className="save-btn" onClick={handleSave}>💾</button>
                      <button className="cancel-btn" onClick={() => setEditingId(null)}>❌</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{getCustomerName(res)}</td>
                    <td>{getReservationDate(res)}</td>
                    <td>{res.time || "N/A"}</td>
                    <td>{res.guests || "N/A"}</td>
                    <td>
                      <span className={`status-badge status-${res.status}`}>
                        {res.status}
                      </span>
                    </td>
                    <td>
                      <div style={{fontSize: "0.85em"}}>
                        <div>{getCustomerEmail(res)}</div>
                        <div>{getCustomerPhone(res)}</div>
                      </div>
                    </td>
                    <td>
                      {canEdit || canDelete ? (
                        <>
                          {canEdit && (
                            <button className="edit-btn" onClick={() => handleEdit(res)}>
                              ✏️
                            </button>
                          )}
                          {canDelete && (
                            <button className="delete-btn" onClick={() => handleDelete(res.id)}>
                              🗑️
                            </button>
                          )}
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
    </>
  )}
</div>


);
};

export default ReservationTable;
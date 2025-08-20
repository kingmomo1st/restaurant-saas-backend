import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/PrivateDiningTable.css";

const PrivateDiningTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { user, isSuperAdmin } = useAuth();
  const role = user?.role;
  const canEdit = role === "admin" || role === "manager" || isSuperAdmin;
  const canDelete = role === "admin" || isSuperAdmin;

  const [formData, setFormData] = useState({
    requesterName: "",
    date: "",
    time: "",
    partySize: 6,
    notes: "",
    status: "pending",
    phone: "",
    email: "",
    budget: "",
    specialRequests: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }

      const response = await fetch(`/api/private-dining?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const entries = await response.json();
      console.log("🔍 Private Dining Data:", entries); // 👈 ADD THIS
      console.log("🔍 Sample entry:", entries[0]); // 👈 ADD THIS
      console.log(`✅ Private Dining: Fetched ${entries.length} requests`);
      setData(entries);
      console.log(`✅ Private Dining: Fetched ${entries.length} requests`);
      setData(entries);
    } catch (err) {
      console.error("❌ Failed to fetch Private Dining entries:", err);
      setData([]);
      toast.error("Failed to fetch private dining requests");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setFormData({
      requesterName: entry.requesterName || "",
      date: entry.date || "",
      time: entry.time || "",
      partySize: entry.partySize || 6,
      notes: entry.notes || "",
      status: entry.status || "pending",
      phone: entry.phone || "",
      email: entry.email || "",
      budget: entry.budget || "",
      specialRequests: entry.specialRequests || "",
    });
  };

  const handleSave = async () => {
    if (!formData.requesterName.trim() || !formData.date || !formData.time) {
      toast.error("Requester name, date, and time are required");
      return;
    }

    try {
      const response = await fetch(`/api/private-dining/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          updatedBy: user?.email || "Unknown",
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success("Private dining request updated successfully");
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error("❌ Error updating entry:", err);
      toast.error("Failed to update private dining request");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this private dining request?")) return;

    try {
      const response = await fetch(`/api/private-dining/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success("Private dining request deleted successfully");
      fetchData();
    } catch (err) {
      console.error("❌ Error deleting entry:", err);
      toast.error("Failed to delete private dining request");
    }
  };

  const exportCSV = () => {
    const rows = filteredData.map((entry) => ({
      Requester: entry.requesterName || "N/A",
      Date: entry.date || "N/A",
      Time: entry.time || "N/A",
      "Party Size": entry.partySize || "N/A",
      Status: entry.status || "N/A",
      Type: entry.requesterType || "N/A",
      Phone: entry.phone || "N/A",
      Email: entry.email || "N/A",
      Budget: entry.budget || "N/A",
      Notes: entry.notes || "N/A",
      "Special Requests": entry.specialRequests || "N/A",
      Created: entry.createdAt ? format(new Date(entry.createdAt), "yyyy-MM-dd HH:mm") : "N/A",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `private_dining_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchData();
  }, [selectedFranchise, selectedLocation]);

  useEffect(() => {
    let result = [...data];

    if (searchTerm) {
      result = result.filter((entry) =>
        entry.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.phone?.includes(searchTerm) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((entry) => entry.status === statusFilter);
    }

    result.sort((a, b) => {
      const aDate = new Date(a.date || a.createdAt || 0);
      const bDate = new Date(b.date || b.createdAt || 0);
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

    setFilteredData(result);
  }, [data, searchTerm, statusFilter, sortOrder]);

  const metrics = {
    total: data.length,
    pending: data.filter((d) => d.status === "pending").length,
    contacted: data.filter((d) => d.status === "contacted").length,
    confirmed: data.filter((d) => d.status === "confirmed").length,
    cancelled: data.filter((d) => d.status === "cancelled").length,
    totalGuests: data.reduce((sum, d) => sum + (d.partySize || 0), 0),
  };

  if (loading) {
    return (
      <div className="private-dining-table">
        <p>Loading private dining requests…</p>
      </div>
    );
  }

  return (
    <div className="private-dining-table">
      <div className="private-dining-header">
        <h2>🍾 Private Dining Management</h2>
        <button onClick={fetchData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {!selectedFranchise ? (
        <div className="no-franchise-selected">
          <h3>🏢 Select a Franchise</h3>
          <p>Please select a franchise to view private dining requests.</p>
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="dashboard-metrics">
            <div className="metric-card"><strong>Total:</strong> {metrics.total}</div>
            <div className="metric-card pending"><strong>Pending:</strong> {metrics.pending}</div>
            <div className="metric-card contacted"><strong>Contacted:</strong> {metrics.contacted}</div>
            <div className="metric-card confirmed"><strong>Confirmed:</strong> {metrics.confirmed}</div>
            <div className="metric-card cancelled"><strong>Cancelled:</strong> {metrics.cancelled}</div>
            <div className="metric-card"><strong>Total Guests:</strong> {metrics.totalGuests}</div>
          </div>

          {/* Controls */}
          <div className="private-dining-controls">
            <input
              type="text"
              placeholder="Search by name, email, phone, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button onClick={exportCSV} className="export-btn">
              Export CSV ({filteredData.length})
            </button>
          </div>

          {/* Table */}
          {filteredData.length === 0 ? (
            <div className="no-private-dining">
              <h3>🍾 No private dining requests found</h3>
              <p>No requests match your current filters.</p>
              <p>Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Date & Time</th>
                    <th>Party Size</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Budget</th>
                    <th>Notes</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((entry) => (
                    <tr key={entry.id}>
                      {editingId === entry.id ? (
                        <>
                          <td>
                            <input
                              value={formData.requesterName}
                              onChange={(e) =>
                                setFormData({ ...formData, requesterName: e.target.value })
                              }
                              placeholder="Requester name*"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={formData.date}
                              onChange={(e) =>
                                setFormData({ ...formData, date: e.target.value })
                              }
                            />
                            <input
                              type="time"
                              value={formData.time}
                              onChange={(e) =>
                                setFormData({ ...formData, time: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="2"
                              max="100"
                              value={formData.partySize}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  partySize: parseInt(e.target.value) || 2,
                                })
                              }
                            />
                          </td>
                          <td>
                            <select
                              value={formData.status}
                              onChange={(e) =>
                                setFormData({ ...formData, status: e.target.value })
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="email"
                              placeholder="Email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                              }
                            />
                            <input
                              type="tel"
                              placeholder="Phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <input
                              placeholder="Budget"
                              value={formData.budget}
                              onChange={(e) =>
                                setFormData({ ...formData, budget: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <textarea
                              placeholder="Notes"
                              value={formData.notes}
                              onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                              }
                              rows="2"
                            />
                            <textarea
                              placeholder="Special requests"
                              value={formData.specialRequests}
                              onChange={(e) =>
                                setFormData({ ...formData, specialRequests: e.target.value })
                              }
                              rows="2"
                            />
                          </td>
                          <td>—</td>
                          <td>
                            <button className="save-btn" onClick={handleSave}>
                              💾 Save
                            </button>
                            <button className="cancel-btn" onClick={() => setEditingId(null)}>
                              ❌ Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong>{entry.requesterName || "N/A"}</strong>
                            <div className="requester-type">
                              {entry.requesterType === "customer" ? "👤 Registered" : "👥 Guest"}
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>
                                {entry.date
                                  ? format(new Date(entry.date), "MMM d, yyyy")
                                  : "N/A"}
                              </strong>
                            </div>
                            <div>{entry.time || "N/A"}</div>
                          </td>
                          <td>
                            <strong>{entry.partySize || "N/A"}</strong>
                            {entry.partySize > 1 ? " guests" : " guest"}
                          </td>
                          <td>
                            <span className={`status-badge status-${entry.status}`}>
                              {entry.status || "pending"}
                            </span>
                          </td>
                          <td>
                            <div>
                              {entry.email && <div>📧 {entry.email}</div>}
                              {entry.phone && <div>📞 {entry.phone}</div>}
                            </div>
                          </td>
                          <td>{entry.budget || "—"}</td>
                          <td>
                            <div className="notes-cell">
                              {entry.notes && (
                                <div><strong>Notes:</strong> {entry.notes}</div>
                              )}
                              {entry.specialRequests && (
                                <div><strong>Special:</strong> {entry.specialRequests}</div>
                              )}
                            </div>
                          </td>
                          <td>
                          {(() => {
                              try {
                                if (!entry.createdAt) return "—";
                          // Handle Firestore timestamp
                                if (entry.createdAt._seconds) {
                                return formatDistanceToNow(new Date(entry.createdAt._seconds * 1000), {
                                addSuffix: true,
                                    });
                                  }
                          // Handle regular date
                              const date = new Date(entry.createdAt);
                              return isNaN(date.getTime()) ? "—" : formatDistanceToNow(date, {
                              addSuffix: true,
                                });
                                } catch (error) {
                                console.warn("Date formatting error:", error);
                                  return "—";
                                 }
                                })()}
                          </td>
                          {(canEdit || canDelete) && (
                            <td>
                              <div className="action-buttons">
                                {canEdit && (
                                  <button
                                    onClick={() => handleEdit(entry)}
                                    className="edit-btn"
                                    title="Edit Private Dining Request"
                                  >
                                    ✏️ Edit
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="delete-btn"
                                    title="Delete Private Dining Request"
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrivateDiningTable;

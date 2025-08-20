import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminLoyalUsers.css";

const AdminLoyalUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPointsModal, setShowPointsModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("All");
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [stats, setStats] = useState(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    loyaltyPoints: 0,
    phone: "",
    notes: "",
    status: "active",
  });

  const [pointsFormData, setPointsFormData] = useState({
    points: "",
    reason: "",
    action: "add",
  });

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;
  const canEdit = role === "admin" || role === "manager" || isSuperAdmin;
  const canManagePoints = role === "admin" || isSuperAdmin;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }
      const response = await fetch(`/api/users/stats?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("❌ Error fetching stats:", err);
    }
  };

  const handleEdit = (userData) => {
    setEditingId(userData.id);
    setEditFormData({
      name: userData.name || "",
      email: userData.email || "",
      loyaltyPoints: userData.loyaltyPoints || 0,
      phone: userData.phone || "",
      notes: userData.notes || "",
      status: userData.status || "active",
    });
  };

  const handleSave = async () => {
    if (!editFormData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      const response = await fetch(`/api/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          updatedBy: user?.email || "Unknown",
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      toast.success("User updated successfully");
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error("❌ Error updating user:", err);
      toast.error("Failed to update user");
    }
  };

  const handlePointsUpdate = async () => {
    if (!pointsFormData.points || !pointsFormData.reason.trim()) {
      toast.error("Points amount and reason are required");
      return;
    }
    try {
      const response = await fetch(`/api/users/${showPointsModal}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pointsFormData,
          createdBy: user?.email || "Unknown",
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      toast.success(result.message);
      setShowPointsModal(null);
      setPointsFormData({ points: "", reason: "", action: "add" });
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error("❌ Error updating points:", err);
      toast.error("Failed to update points");
    }
  };

  const exportCSV = () => {
    const rows = filteredUsers.map((u) => ({
      Name: u.name || "Unknown",
      Email: u.email || "No email",
      "Loyalty Points": u.loyaltyPoints || 0,
      Tier: u.tier || "Bronze",
      "Order Count": u.orderCount || 0,
      "Total Spent": `$${u.totalSpent || 0}`,
      Phone: u.phone || "N/A",
      Status: u.status || "active",
      "Created At": u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd HH:mm") : "N/A",
      "Last Order": u.lastOrderDate ? format(new Date(u.lastOrderDate), "yyyy-MM-dd") : "Never",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `loyal_users_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Platinum": return "#9b59b6";
      case "Gold": return "#f1c40f";
      case "Silver": return "#95a5a6";
      case "Bronze": return "#e67e22";
      default: return "#95a5a6";
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [selectedFranchise, selectedLocation, sortBy, sortOrder]);

  useEffect(() => {
    let result = [...users];
    if (searchTerm) {
      result = result.filter((u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
      );
    }
    if (tierFilter !== "All") {
      result = result.filter((u) => u.tier === tierFilter);
    }
    setFilteredUsers(result);
  }, [users, searchTerm, tierFilter]);

  if (loading) {
    return <div className="admin-loyal-users"><p>Loading loyal users…</p></div>;
  }

  return (
    <div className="admin-loyal-users">
      <h2>👑 Loyal Users Management</h2>
      <button onClick={fetchUsers} className="refresh-btn">🔄 Refresh</button>

      {/* Controls */}
      <div className="loyal-users-controls">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="All">All Tiers</option>
          <option value="Bronze">Bronze</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="points">Points</option>
          <option value="purchases">Purchases</option>
          <option value="spent">Spent</option>
          <option value="name">Name</option>
          <option value="createdAt">Signup Date</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Highest First</option>
          <option value="asc">Lowest First</option>
        </select>
        <button onClick={exportCSV} className="export-btn">Export CSV ({filteredUsers.length})</button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Loyalty Points</th>
              <th>Tier</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Joined</th>
              {(canEdit || canManagePoints) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name || user.email}</td>
                <td>{user.loyaltyPoints}</td>
                <td>
                  <span
                    style={{
                      backgroundColor: getTierColor(user.tier),
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {user.tier}
                  </span>
                </td>
                <td>{user.orderCount}</td>
                <td>${user.totalSpent?.toFixed(2)}</td>
                <td>{user.status}</td>
                <td>{user.createdAt ? format(new Date(user.createdAt), "yyyy-MM-dd") : "—"}</td>
                {(canEdit || canManagePoints) && (
                  <td>
                    {canEdit && (
                      <button onClick={() => handleEdit(user)}>✏️ Edit</button>
                    )}
                    {canManagePoints && (
                      <button onClick={() => setShowPointsModal(user.id)}>🎯 Points</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Points Modal */}
      {showPointsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Manage Loyalty Points</h3>
            <select
              value={pointsFormData.action}
              onChange={(e) =>
                setPointsFormData({ ...pointsFormData, action: e.target.value })
              }
            >
              <option value="add">Add Points</option>
              <option value="subtract">Subtract Points</option>
            </select>
            <input
              type="number"
              min="1"
              placeholder="Points"
              value={pointsFormData.points}
              onChange={(e) =>
                setPointsFormData({ ...pointsFormData, points: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Reason"
              value={pointsFormData.reason}
              onChange={(e) =>
                setPointsFormData({ ...pointsFormData, reason: e.target.value })
              }
            />
            <div className="modal-actions">
              <button onClick={handlePointsUpdate}>💾 Update</button>
              <button onClick={() => setShowPointsModal(null)}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoyalUsers;
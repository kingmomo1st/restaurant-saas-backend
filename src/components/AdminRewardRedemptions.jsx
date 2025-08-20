import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminRewardRedemptions.css";

const AdminRewardRedemptions = () => {
  const [redemptions, setRedemptions] = useState([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [rewardFilter, setRewardFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("redeemedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;
  const canEdit = role === "admin" || role === "manager" || isSuperAdmin;

  const fetchRedemptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/rewards/redemptions?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const data = await response.json();
      setRedemptions(data);
      console.log(`✅ Fetched ${data.length} redemptions`);
    } catch (err) {
      console.error("❌ Error fetching redemptions:", err);
      setRedemptions([]);
      toast.error("Failed to fetch redemptions");
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
      params.append("days", "30");

      const response = await fetch(`/api/rewards/redemption-stats?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error("❌ Error fetching redemption stats:", err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingId || !editStatus) return;
    try {
      const response = await fetch(`/api/rewards/redemptions/${editingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          updatedBy: user?.email || "Unknown",
        }),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      toast.success("Redemption status updated successfully");
      setEditingId(null);
      setEditStatus("");
      setEditNotes("");
      fetchRedemptions();
      fetchStats();
    } catch (err) {
      console.error("❌ Error updating redemption status:", err);
      toast.error("Failed to update redemption status");
    }
  };

  const exportCSV = () => {
    const rows = filteredRedemptions.map((r) => ({
      "User Email": r.userEmail || "N/A",
      "User ID": r.userId || "N/A",
      "Reward Title": r.rewardTitle || "N/A",
      "Reward ID": r.rewardId || "N/A",
      "Points Used": r.pointsUsed || 0,
      Status: r.status || "redeemed",
      "Redeemed At": r.redeemedAt
        ? format(new Date(r.redeemedAt), "yyyy-MM-dd HH:mm:ss")
        : "N/A",
      Notes: r.notes || "N/A",
      "Updated At": r.updatedAt
        ? format(new Date(r.updatedAt), "yyyy-MM-dd HH:mm:ss")
        : "N/A",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `reward_redemptions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchRedemptions();
    fetchStats();
  }, [selectedFranchise, selectedLocation, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    let result = [...redemptions];

    if (searchTerm) {
      result = result.filter(
        (r) =>
          r.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.rewardTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (rewardFilter !== "All") {
      result = result.filter((r) => r.rewardTitle === rewardFilter);
    }

    setFilteredRedemptions(result);
  }, [redemptions, searchTerm, statusFilter, rewardFilter]);

  const uniqueRewards = [...new Set(redemptions.map((r) => r.rewardTitle).filter(Boolean))];
  if (loading) {
    return (
      <div className="admin-reward-redemptions">
        <p>Loading reward redemptions...</p>
      </div>
    );
  }

  return (
    <div className="admin-reward-redemptions">
      <div className="redemptions-header">
        <h2>🎁 Reward Redemptions</h2>
        <button
          onClick={() => {
            fetchRedemptions();
            fetchStats();
          }}
          className="refresh-btn"
        >
          🔄 Refresh
        </button>
      </div>

      {!selectedFranchise ? (
        <div className="no-franchise-selected">
          <h3>🏢 Select a Franchise</h3>
          <p>Please select a franchise to view reward redemptions.</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="dashboard-metrics">
              <div className="metric-card">
                <strong>Total Redemptions:</strong> {stats.totalRedemptions}
              </div>
              <div className="metric-card">
                <strong>Points Redeemed:</strong>{" "}
                {stats.totalPointsRedeemed?.toLocaleString() || 0}
              </div>
              <div className="metric-card">
                <strong>Avg Points/Redemption:</strong>{" "}
                {Math.round(stats.averagePointsPerReward || 0)}
              </div>
              <div className="metric-card">
                <strong>Unique Users:</strong> {stats.uniqueUsers || 0}
              </div>
            </div>
          )}

          {stats?.topRewards?.length > 0 && (
            <div className="top-rewards">
              <h3>🏆 Most Redeemed Rewards</h3>
              <div className="top-rewards-list">
                {stats.topRewards.map((reward, index) => (
                  <div key={index} className="top-reward-item">
                    <span className="reward-rank">#{index + 1}</span>
                    <span className="reward-name">{reward.title}</span>
                    <span className="reward-count">{reward.count} redemptions</span>
                    <span className="reward-points">{reward.totalPointsUsed} points</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="redemptions-controls">
            <input
              type="text"
              placeholder="Search by email, reward, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="redeemed">Redeemed</option>
              <option value="pending">Pending</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={rewardFilter}
              onChange={(e) => setRewardFilter(e.target.value)}
            >
              <option value="All">All Rewards</option>
              {uniqueRewards.map((reward) => (
                <option key={reward} value={reward}>
                  {reward}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="redeemedAt">Sort by Date</option>
              <option value="pointsUsed">Sort by Points</option>
              <option value="rewardTitle">Sort by Reward</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button onClick={exportCSV} className="export-btn">
              Export CSV ({filteredRedemptions.length})
            </button>
          </div>

          {filteredRedemptions.length === 0 ? (
            <div className="no-redemptions">
              <h3>🎁 No redemptions found</h3>
              <p>No redemptions match your current filters.</p>
              <p>Redemptions will appear here when customers redeem rewards.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Reward</th>
                    <th>Points Used</th>
                    <th>Status</th>
                    <th>Redeemed</th>
                    <th>Notes</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRedemptions.map((r) => (
                    <tr key={r.id}>
                      {editingId === r.id ? (
                        <>
                          <td>
                            <div>
                              <strong>{r.userEmail || "N/A"}</strong>
                              <div>ID: {r.userId}</div>
                            </div>
                          </td>
                          <td>
                            <strong>{r.rewardTitle}</strong>
                          </td>
                          <td>
                            <strong>{r.pointsUsed?.toLocaleString() || 0}</strong> pts
                          </td>
                          <td>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                            >
                              <option value="redeemed">Redeemed</option>
                              <option value="pending">Pending</option>
                              <option value="fulfilled">Fulfilled</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            {r.redeemedAt
                              ? format(new Date(r.redeemedAt), "MMM d, yyyy HH:mm")
                              : "—"}
                          </td>
                          <td>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add notes..."
                              rows="2"
                            />
                          </td>
                          <td>
                            <button onClick={handleUpdateStatus} className="save-btn">
                              💾 Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditStatus("");
                                setEditNotes("");
                              }}
                              className="cancel-btn"
                            >
                              ❌ Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div className="customer-info">
                              <strong>{r.userEmail || "Unknown User"}</strong>
                              <div className="user-id">ID: {r.userId}</div>
                            </div>
                          </td>
                          <td>
                            <div className="reward-info">
                              <strong>{r.rewardTitle}</strong>
                              <div className="reward-id">ID: {r.rewardId}</div>
                            </div>
                          </td>
                          <td>
                            <strong>{r.pointsUsed?.toLocaleString() || 0}</strong> pts
                          </td>
                          <td>
                            <span className={`status-badge status-${r.status}`}>
                              {r.status || "redeemed"}
                            </span>
                          </td>
                          <td>
                            <div>
                              <strong>
                                {r.redeemedAt
                                  ? format(new Date(r.redeemedAt), "MMM d, yyyy")
                                  : "—"}
                              </strong>
                              <div className="time-ago">
                                {r.redeemedAt
                                  ? formatDistanceToNow(new Date(r.redeemedAt), {
                                      addSuffix: true,
                                    })
                                  : "—"}
                              </div>
                            </div>
                          </td>
                          <td>{r.notes || "—"}</td>
                          {canEdit && (
                            <td>
                              <button
                                onClick={() => {
                                  setEditingId(r.id);
                                  setEditStatus(r.status || "redeemed");
                                  setEditNotes(r.notes || "");
                                }}
                                className="edit-btn"
                                title="Edit Status"
                              >
                                ✏️ Edit
                              </button>
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

export default AdminRewardRedemptions;
import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminRewardsPanel.css";

const builder = imageUrlBuilder(sanityClient);

const AdminRewardsPanel = () => {
  const [rewards, setRewards] = useState([]);
  const [filteredRewards, setFilteredRewards] = useState([]);
  const [redemptionData, setRedemptionData] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState("_createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pointsRequired: "",
    maxRedemptions: "",
    category: "food",
    available: true,
    expirationDate: "",
    terms: ""
  });

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;
  const canEdit = role === "admin" || role === "manager" || isSuperAdmin;
  const canDelete = role === "admin" || isSuperAdmin;

  const fetchRewards = async () => {
    if (!selectedFranchise?._id) return;
    setLoading(true);
    try {
      const query = `
        *[_type == "reward" && location->franchise->_id == $franchiseId] {
          ...,
          location->{ title, franchise->{_id, title} }
        } | order(${sortField} ${sortOrder})
      `;
      const data = await sanityClient.fetch(query, { franchiseId: selectedFranchise._id });
      setRewards(data);
    } catch (err) {
      console.error("❌ Failed to fetch rewards:", err);
      toast.error("Failed to fetch rewards");
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptionData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }

      const response = await fetch(`/api/rewards/redemption-stats?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setRedemptionData(data.redemptionsByReward || {});
      setStats(data.stats || null);
    } catch (err) {
      console.error("❌ Error fetching redemption data:", err);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.pointsRequired) {
      toast.error("Title and points required are required");
      return;
    }

    if (!selectedFranchise?.locationId) {
      toast.error("Please select a valid franchise and location before saving.");
      return;
    }

    try {
      const newReward = {
        _type: "reward",
        title: formData.title,
        description: formData.description,
        pointsRequired: parseInt(formData.pointsRequired),
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : undefined,
        category: formData.category,
        available: formData.available,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
        terms: formData.terms,
        redemptionCount: 0,
        location: {
          _type: "reference",
          _ref: selectedFranchise.locationId,
        },
      };

      await sanityClient.create(newReward);
      toast.success("Reward created successfully");
      resetForm();
      setShowModal(false);
      fetchRewards();
    } catch (err) {
      console.error("❌ Failed to create reward:", err);
      toast.error("Failed to create reward");
    }
  };

  const handleUpdate = async () => {
    if (!formData.title.trim() || !formData.pointsRequired) {
      toast.error("Title and points required are required");
      return;
    }

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        pointsRequired: parseInt(formData.pointsRequired),
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : undefined,
        category: formData.category,
        available: formData.available,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
        terms: formData.terms,
      };

      await sanityClient.patch(editingReward._id).set(updateData).commit();
      toast.success("Reward updated successfully");
      resetForm();
      setShowModal(false);
      setEditingReward(null);
      fetchRewards();
    } catch (err) {
      console.error("❌ Failed to update reward:", err);
      toast.error("Failed to update reward");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;
    try {
      await sanityClient.delete(id);
      toast.success("Reward deleted successfully");
      fetchRewards();
      fetchRedemptionData();
    } catch (err) {
      console.error("❌ Failed to delete reward:", err);
      toast.error("Failed to delete reward");
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      await sanityClient.patch(id).set({ available: !currentStatus }).commit();
      toast.success(`Reward ${!currentStatus ? "enabled" : "disabled"}`);
      fetchRewards();
    } catch (err) {
      console.error("❌ Failed to toggle availability:", err);
      toast.error("Failed to update reward availability");
    }
  };

  const handleEdit = (reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title || "",
      description: reward.description || "",
      pointsRequired: reward.pointsRequired?.toString() || "",
      maxRedemptions: reward.maxRedemptions?.toString() || "",
      category: reward.category || "food",
      available: reward.available !== false,
      expirationDate: reward.expirationDate ? reward.expirationDate.slice(0, 16) : "",
      terms: reward.terms || ""
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      pointsRequired: "",
      maxRedemptions: "",
      category: "food",
      available: true,
      expirationDate: "",
      terms: ""
    });
    setEditingReward(null);
  };

  const exportCSV = () => {
    const rows = filteredRewards.map((reward) => {
      const redemptions = redemptionData[reward._id] || {};
      return {
        Title: reward.title || "N/A",
        Description: reward.description || "",
        "Points Required": reward.pointsRequired || 0,
        Category: reward.category || "N/A",
        "Max Redemptions": reward.maxRedemptions || "Unlimited",
        "Times Redeemed": redemptions.count || reward.redemptionCount || 0,
        "Total Points Used": redemptions.totalPointsUsed || 0,
        Available: reward.available ? "Yes" : "No",
        Expires: reward.expirationDate ? format(new Date(reward.expirationDate), "yyyy-MM-dd") : "Never",
        Created: reward._createdAt ? format(new Date(reward._createdAt), "yyyy-MM-dd") : "N/A"
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `rewards_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isExpired = (expirationDate) =>
    expirationDate && new Date(expirationDate) < new Date();

  const getRedemptionCount = (reward) => {
    const firebase = redemptionData[reward._id]?.count || 0;
    const sanity = reward.redemptionCount || 0;
    return Math.max(firebase, sanity);
  };

  const getRedemptionPercentage = (reward) => {
    if (!reward.maxRedemptions) return 0;
    return (getRedemptionCount(reward) / reward.maxRedemptions) * 100;
  };

  const getTotalPointsUsed = (reward) =>
    redemptionData[reward._id]?.totalPointsUsed || 0;

  useEffect(() => {
    if (selectedFranchise) {
      fetchRewards();
      fetchRedemptionData();
    }
  }, [selectedFranchise, sortField, sortOrder]);

  useEffect(() => {
    let result = [...rewards];

    if (searchQuery) {
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      if (statusFilter === "available") {
        result = result.filter((r) => r.available && !isExpired(r.expirationDate));
      } else if (statusFilter === "unavailable") {
        result = result.filter((r) => !r.available);
      } else if (statusFilter === "expired") {
        result = result.filter((r) => isExpired(r.expirationDate));
      }
    }

    setFilteredRewards(result);
  }, [rewards, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="admin-rewards-panel">
        <p>Loading rewards...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-rewards-panel">
        <div className="rewards-header">
          <h2>🏆 Loyalty Rewards Management</h2>
          <button
            onClick={() => {
              fetchRewards();
              fetchRedemptionData();
            }}
            className="refresh-btn"
          >
            🔄 Refresh
          </button>
        </div>
    
        {!selectedFranchise ? (
          <div className="no-franchise-selected">
            <h3>🏢 Select a Franchise</h3>
            <p>Please select a franchise to manage rewards.</p>
          </div>
        ) : (
          <>
            {stats && (
              <div className="dashboard-metrics">
                <div className="metric-card">
                  <strong>Total Rewards:</strong> {rewards.length}
                </div>
                <div className="metric-card available">
                  <strong>Available:</strong>{" "}
                  {rewards.filter((r) => r.available).length}
                </div>
                <div className="metric-card expired">
                  <strong>Expired:</strong>{" "}
                  {rewards.filter((r) => isExpired(r.expirationDate)).length}
                </div>
                <div className="metric-card redeemed">
                  <strong>Total Redemptions:</strong> {stats.totalRedemptions}
                </div>
                <div className="metric-card points">
                  <strong>Points Redeemed:</strong>{" "}
                  {stats.totalPointsRedeemed?.toLocaleString() || 0}
                </div>
                <div className="metric-card avg">
                  <strong>Avg Points/Reward:</strong>{" "}
                  {Math.round(stats.averagePointsPerReward || 0)}
                </div>
              </div>
            )}
    
            {stats?.topRewards?.length > 0 && (
              <div className="top-rewards">
                <h3>🌟 Most Popular Rewards</h3>
                <div className="top-rewards-list">
                  {stats.topRewards.map((reward, index) => (
                    <div key={index} className="top-reward-item">
                      <span className="reward-rank">#{index + 1}</span>
                      <span className="reward-name">{reward.title}</span>
                      <span className="reward-redemptions">
                        {reward.count} redemptions
                      </span>
                      <span className="reward-points">
                        {reward.totalPointsUsed} points
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
    
            <div className="rewards-controls">
              <input
                type="text"
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="_createdAt">Sort by Created</option>
                <option value="pointsRequired">Sort by Points</option>
                <option value="title">Sort by Title</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              {canEdit && (
                <button onClick={() => setShowModal(true)} className="create-btn">
                  ➕ Create Reward
                </button>
              )}
              <button onClick={exportCSV} className="export-btn">
                Export CSV ({filteredRewards.length})
              </button>
            </div>
    
            {filteredRewards.length === 0 ? (
              <div className="no-rewards">
                <h3>🏆 No rewards found</h3>
                <p>No rewards match your current filters.</p>
                {canEdit && (
                  <p>Create your first reward using the button above.</p>
                )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Reward</th>
                      <th>Points Required</th>
                      <th>Category</th>
                      <th>Redemptions</th>
                      <th>Status</th>
                      <th>Expires</th>
                      <th>Image</th>
                      {(canEdit || canDelete) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRewards.map((reward) => (
                      <tr
                        key={reward._id}
                        className={
                          isExpired(reward.expirationDate) ? "expired-row" : ""
                        }
                      >
                        <td>
                          <div className="reward-info">
                            <strong>{reward.title}</strong>
                            {reward.description && (
                              <div className="reward-description">
                                {reward.description}
                              </div>
                            )}
                            {reward.terms && (
                              <div className="reward-terms">
                                Terms: {reward.terms}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="points-required">
                            <strong>
                              {reward.pointsRequired?.toLocaleString() || 0}
                            </strong>{" "}
                            pts
                          </div>
                        </td>
                        <td>
                          <span
                            className={`category-badge category-${reward.category}`}
                          >
                            {reward.category || "general"}
                          </span>
                        </td>
                        <td>
                          <div className="redemption-info">
                            <strong>{getRedemptionCount(reward)}</strong>
                            {reward.maxRedemptions
                              ? ` / ${reward.maxRedemptions}`
                              : " / ∞"}
                            <div className="points-used">
                              {getTotalPointsUsed(reward)} pts used
                            </div>
                            {reward.maxRedemptions && (
                              <div className="redemption-bar">
                                <div
                                  className="redemption-fill"
                                  style={{
                                    width: `${getRedemptionPercentage(reward)}%`
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              isExpired(reward.expirationDate)
                                ? "status-expired"
                                : reward.available
                                ? "status-available"
                                : "status-unavailable"
                            }`}
                          >
                            {isExpired(reward.expirationDate)
                              ? "Expired"
                              : reward.available
                              ? "Available"
                              : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          {reward.expirationDate ? (
                            <div>
                              <strong>
                                {format(
                                  new Date(reward.expirationDate),
                                  "MMM d, yyyy"
                                )}
                              </strong>
                              <div className="time-remaining">
                                {isExpired(reward.expirationDate)
                                  ? "Expired"
                                  : formatDistanceToNow(
                                      new Date(reward.expirationDate),
                                      { addSuffix: true }
                                    )}
                              </div>
                            </div>
                          ) : (
                            <span className="never-expires">Never</span>
                          )}
                        </td>
                        <td>
                          {reward.image ? (
                            <img
                              src={builder.image(reward.image).width(60).height(60).url()}
                              alt="Reward"
                              className="reward-image"
                            />
                          ) : (
                            <div className="no-image">No image</div>
                          )}
                        </td>
                        {(canEdit || canDelete) && (
                          <td>
                            <div className="action-buttons">
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => handleEdit(reward)}
                                    className="edit-btn"
                                    title="Edit Reward"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleToggleAvailability(
                                        reward._id,
                                        reward.available
                                      )
                                    }
                                    className={
                                      reward.available
                                        ? "disable-btn"
                                        : "enable-btn"
                                    }
                                    title={
                                      reward.available ? "Disable" : "Enable"
                                    }
                                  >
                                    {reward.available ? "⏸️ Disable" : "▶️ Enable"}
                                  </button>
                                </>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(reward._id)}
                                  className="delete-btn"
                                  title="Delete Reward"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
    
            {showModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>{editingReward ? "Edit Reward" : "Create Reward"}</h3>
                  <div className="reward-form">
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="Reward Title*"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Points Required*"
                        value={formData.pointsRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsRequired: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="form-row">
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                      >
                        <option value="food">Food & Drinks</option>
                        <option value="discount">Discounts</option>
                        <option value="experience">Experiences</option>
                        <option value="merchandise">Merchandise</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Max Redemptions (optional)"
                        value={formData.maxRedemptions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxRedemptions: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="form-row">
                      <textarea
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows="2"
                      />
                    </div>
                    <div className="form-row">
                      <textarea
                        placeholder="Terms and Conditions"
                        value={formData.terms}
                        onChange={(e) =>
                          setFormData({ ...formData, terms: e.target.value })
                        }
                        rows="2"
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="datetime-local"
                        placeholder="Expiration Date"
                        value={formData.expirationDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expirationDate: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="form-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.available}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              available: e.target.checked
                            })
                          }
                        />
                        Available for Redemption
                      </label>
                    </div>
                    <div className="modal-actions">
                      {editingReward ? (
                        <button onClick={handleUpdate} className="save-btn">
                          💾 Update Reward
                        </button>
                      ) : (
                        <button onClick={handleCreate} className="save-btn">
                          ➕ Create Reward
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
                        className="cancel-btn"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }
};

export default AdminRewardsPanel;
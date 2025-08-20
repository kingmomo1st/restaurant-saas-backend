import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminRewardTierManager.css";

const builder = imageUrlBuilder(sanityClient);

const AdminRewardTierManager = () => {
  const [tiers, setTiers] = useState([]);
  const [filteredTiers, setFilteredTiers] = useState([]);
  const [tierStats, setTierStats] = useState({});
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pointsRequired: "",
    benefits: "",
    color: "#3498db",
    icon: "",
    multiplier: "1",
    hidden: false,
  });

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;
  const canEdit = role === "admin" || role === "manager" || isSuperAdmin;
  const canDelete = role === "admin" || isSuperAdmin;

  const fetchTiers = async () => {
    if (!selectedFranchise?._id) return;
    setLoading(true);
    try {
      const query = `
        *[_type == "rewardTier" && location->franchise->_id == $franchiseId] {
          _id,
          title,
          description,
          pointsRequired,
          benefits,
          color,
          icon,
          multiplier,
          hidden,
          image,
          _createdAt,
          location->{_id, title, franchise->{_id, title}}
        } | order(pointsRequired ${sortOrder})
      `;

      const data = await sanityClient.fetch(query, {
        franchiseId: selectedFranchise._id,
      });

      console.log(`✅ Reward Tiers: fetched ${data.length}`);
      setTiers(data);
    } catch (err) {
      console.error("❌ Failed to fetch reward tiers:", err);
      toast.error("Failed to fetch reward tiers");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }

      const response = await fetch(`/api/users/stats?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      setUserStats(data);

      const tierUsage = {};
      if (data.tierBreakdown) {
        Object.entries(data.tierBreakdown).forEach(([tierName, count]) => {
          tierUsage[tierName] = {
            userCount: count,
            percentage: data.totalUsers > 0 ? ((count / data.totalUsers) * 100).toFixed(1) : 0,
          };
        });
      }
      setTierStats(tierUsage);
    } catch (err) {
      console.error("❌ Error fetching user stats:", err);
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
      const newTier = {
        _type: "rewardTier",
        title: formData.title,
        description: formData.description,
        pointsRequired: parseInt(formData.pointsRequired),
        benefits: formData.benefits,
        color: formData.color,
        icon: formData.icon,
        multiplier: parseFloat(formData.multiplier) || 1,
        hidden: formData.hidden,
        location: {
          _type: "reference",
          _ref: selectedFranchise.locationId,
        },
      };

      await sanityClient.create(newTier);
      toast.success("Reward tier created successfully");
      resetForm();
      setShowModal(false);
      fetchTiers();
    } catch (err) {
      console.error("❌ Failed to create reward tier:", err);
      toast.error("Failed to create reward tier");
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
        benefits: formData.benefits,
        color: formData.color,
        icon: formData.icon,
        multiplier: parseFloat(formData.multiplier) || 1,
        hidden: formData.hidden,
      };

      await sanityClient.patch(editingTier._id).set(updateData).commit();
      toast.success("Reward tier updated successfully");
      resetForm();
      setShowModal(false);
      setEditingTier(null);
      fetchTiers();
    } catch (err) {
      console.error("❌ Failed to update reward tier:", err);
      toast.error("Failed to update reward tier");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reward tier?")) return;

    try {
      await sanityClient.delete(id);
      toast.success("Reward tier deleted successfully");
      fetchTiers();
      fetchUserStats();
    } catch (err) {
      console.error("❌ Failed to delete reward tier:", err);
      toast.error("Failed to delete reward tier");
    }
  };

  const handleToggleVisibility = async (id, currentHidden) => {
    try {
      await sanityClient.patch(id).set({ hidden: !currentHidden }).commit();
      toast.success(`Tier ${!currentHidden ? "hidden" : "made visible"}`);
      fetchTiers();
    } catch (err) {
      console.error("❌ Failed to toggle visibility:", err);
      toast.error("Failed to update tier visibility");
    }
  };

  const handleEdit = (tier) => {
    setEditingTier(tier);
    setFormData({
      title: tier.title || "",
      description: tier.description || "",
      pointsRequired: tier.pointsRequired?.toString() || "",
      benefits: tier.benefits || "",
      color: tier.color || "#3498db",
      icon: tier.icon || "",
      multiplier: tier.multiplier?.toString() || "1",
      hidden: tier.hidden || false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      pointsRequired: "",
      benefits: "",
      color: "#3498db",
      icon: "",
      multiplier: "1",
      hidden: false,
    });
    setEditingTier(null);
  };

  const exportCSV = () => {
    const rows = filteredTiers.map((tier) => {
      const stats = tierStats[tier.title] || {};
      return {
        Title: tier.title || "N/A",
        Description: tier.description || "",
        "Points Required": tier.pointsRequired || 0,
        Benefits: tier.benefits || "",
        Multiplier: tier.multiplier || 1,
        "User Count": stats.userCount || 0,
        "Percentage of Users": `${stats.percentage || 0}%`,
        Color: tier.color || "",
        Icon: tier.icon || "",
        Status: tier.hidden ? "Hidden" : "Visible",
        Created: tier._createdAt ? format(new Date(tier._createdAt), "yyyy-MM-dd") : "N/A",
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `reward_tiers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };
  useEffect(() => {
    if (selectedFranchise) {
      fetchTiers();
      fetchUserStats();
    }
  }, [selectedFranchise, sortOrder]);

  useEffect(() => {
    let result = [...tiers];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (tier) =>
          tier.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tier.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tier.benefits?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      if (statusFilter === "visible") {
        result = result.filter((tier) => !tier.hidden);
      } else if (statusFilter === "hidden") {
        result = result.filter((tier) => tier.hidden);
      }
    }

    setFilteredTiers(result);
  }, [tiers, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="admin-reward-tier-manager">
        <p>Loading reward tiers…</p>
      </div>
    );
  }

  return (
    <div className="admin-reward-tier-manager">
      <div className="tier-manager-header">
        <h2>🏆 Reward Tier Management</h2>
        <button onClick={() => { fetchTiers(); fetchUserStats(); }} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {!selectedFranchise ? (
        <div className="no-franchise-selected">
          <h3>🏢 Select a Franchise</h3>
          <p>Please select a franchise to manage reward tiers.</p>
        </div>
      ) : (
        <>
          {userStats && (
            <div className="dashboard-metrics">
              <div className="metric-card"><strong>Total Users:</strong> {userStats.totalUsers}</div>
              <div className="metric-card"><strong>Total Points:</strong> {userStats.totalPoints?.toLocaleString() || 0}</div>
              <div className="metric-card"><strong>Avg Points:</strong> {Math.round(userStats.averagePoints || 0)}</div>
              <div className="metric-card"><strong>VIP Users:</strong> {userStats.vipUsers || 0}</div>
            </div>
          )}

          {Object.keys(tierStats).length > 0 && (
            <div className="tier-distribution">
              <h3>👥 User Distribution by Tier</h3>
              <div className="tier-stats">
                {Object.entries(tierStats).map(([tierName, stats]) => (
                  <div key={tierName} className="tier-stat">
                    <span className="tier-name">{tierName}</span>
                    <span className="tier-users">{stats.userCount} users</span>
                    <span className="tier-percentage">({stats.percentage}%)</span>
                    <div className="tier-bar">
                      <div className="tier-fill" style={{ width: `${stats.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tier-manager-controls">
            <input
              type="text"
              placeholder="Search tiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">Lowest Points First</option>
              <option value="desc">Highest Points First</option>
            </select>
            {canEdit && (
              <button onClick={() => setShowModal(true)} className="create-btn">
                ➕ Create Tier
              </button>
            )}
            <button onClick={exportCSV} className="export-btn">
              Export CSV ({filteredTiers.length})
            </button>
          </div>

          {filteredTiers.length === 0 ? (
            <div className="no-tiers">
              <h3>🏆 No reward tiers found</h3>
              <p>No tiers match your current filters.</p>
              {canEdit && <p>Create your first reward tier using the button above.</p>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Points Required</th>
                    <th>Users in Tier</th>
                    <th>Benefits</th>
                    <th>Multiplier</th>
                    <th>Status</th>
                    <th>Image</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTiers.map((tier) => {
                    const stats = tierStats[tier.title] || {};
                    return (
                      <tr key={tier._id}>
                        <td>
                          <div className="tier-info">
                            <div className="tier-title" style={{ color: tier.color }}>
                              {tier.icon && <span className="tier-icon">{tier.icon}</span>}
                              <strong>{tier.title}</strong>
                            </div>
                            {tier.description && (
                              <div className="tier-description">{tier.description}</div>
                            )}
                          </div>
                        </td>
                        <td><strong>{tier.pointsRequired?.toLocaleString() || 0}</strong> pts</td>
                        <td>
                          <div className="tier-usage">
                            <strong>{stats.userCount || 0}</strong> users
                            <div className="usage-percentage">({stats.percentage || 0}%)</div>
                          </div>
                        </td>
                        <td>{tier.benefits || "—"}</td>
                        <td><strong>{tier.multiplier || 1}x</strong></td>
                        <td>
                          <span className={`status-badge ${tier.hidden ? "status-hidden" : "status-visible"}`}>
                            {tier.hidden ? "Hidden" : "Visible"}
                          </span>
                        </td>
                        <td>
                          {tier.image ? (
                            <img
                              src={builder.image(tier.image).width(50).height(50).url()}
                              alt="Tier"
                              className="tier-image"
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
                                  <button onClick={() => handleEdit(tier)} className="edit-btn">✏️ Edit</button>
                                  <button
                                    onClick={() => handleToggleVisibility(tier._id, tier.hidden)}
                                    className={tier.hidden ? "show-btn" : "hide-btn"}
                                  >
                                    {tier.hidden ? "👁️ Show" : "🙈 Hide"}
                                  </button>
                                </>
                              )}
                              {canDelete && (
                                <button onClick={() => handleDelete(tier._id)} className="delete-btn">🗑️ Delete</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>{editingTier ? "Edit Reward Tier" : "Create Reward Tier"}</h3>
                <div className="tier-form">
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Tier Title*"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Points Required*"
                      value={formData.pointsRequired}
                      onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Icon (emoji)"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    />
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Points Multiplier"
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <textarea
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="2"
                    />
                  </div>
                  <div className="form-row">
                    <textarea
                      placeholder="Benefits"
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      rows="3"
                    />
                  </div>
                  <div className="form-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.hidden}
                        onChange={(e) => setFormData({ ...formData, hidden: e.target.checked })}
                      />
                      Hidden from Users
                    </label>
                  </div>
                  <div className="modal-actions">
                    {editingTier ? (
                      <button onClick={handleUpdate} className="save-btn">💾 Update Tier</button>
                    ) : (
                      <button onClick={handleCreate} className="save-btn">➕ Create Tier</button>
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
  );
};

export default AdminRewardTierManager;
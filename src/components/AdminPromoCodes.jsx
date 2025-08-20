import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import sanityClient from "../sanity/sanityClient.ts";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminPromoCodes.css";

const AdminPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [filteredPromoCodes, setFilteredPromoCodes] = useState([]);
  const [redemptionData, setRedemptionData] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortField, setSortField] = useState("_createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "percentage",
    value: "",
    maxDiscount: "",
    minOrderAmount: "",
    usageLimit: "",
    expirationDate: "",
    applicableCategories: "",
    active: true
  });

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;
  const canEdit = role === "admin" || role === "manager" || isSuperAdmin;
  const canDelete = role === "admin" || isSuperAdmin;

  const fetchPromoCodes = async () => {
    if (!selectedFranchise?._id) return;
    setLoading(true);
    try {
      const query = `
        *[_type == "promoCode" && location->franchise->_id == $franchiseId] {
          ...,
          location->{ title, franchise->{_id, title} }
        } | order(${sortField} ${sortOrder})
      `;
      const data = await sanityClient.fetch(query, {
        franchiseId: selectedFranchise._id,
      });
      setPromoCodes(data);
    } catch (err) {
      console.error("❌ Failed to fetch promo codes:", err);
      toast.error("Failed to fetch promo codes");
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

      const response = await fetch(`/api/promo/usage-stats?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const data = await response.json();
      setRedemptionData(data.usageByCode || {});
      setStats(data.stats || null);
    } catch (err) {
      console.error("❌ Error fetching redemption data:", err);
    }
  };

  const syncUsageToSanity = async (promoCode, usageCount) => {
    try {
      await sanityClient.patch(promoCode._id).set({ usedCount: usageCount }).commit();
    } catch (err) {
      console.error("❌ Error syncing usage to Sanity:", err);
    }
  };

  const handleCreate = async () => {
    if (!formData.code.trim() || !formData.type || !formData.value) {
      toast.error("Code, type, and value are required");
      return;
    }

    if (!selectedFranchise?.locationId) {
      toast.error("Please select a valid franchise and location before saving.");
      return;
    }

    try {
      const newPromo = {
        _type: "promoCode",
        code: formData.code.toUpperCase(),
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        applicableCategories: formData.applicableCategories
          ? formData.applicableCategories.split(",").map((c) => c.trim())
          : [],
        active: formData.active,
        usedCount: 0,
        location: {
          _type: "reference",
          _ref: selectedFranchise.locationId,
        },
      };

      await sanityClient.create(newPromo);
      toast.success("Promo code created successfully");
      resetForm();
      setShowModal(false);
      fetchPromoCodes();
    } catch (err) {
      console.error("❌ Failed to create promo code:", err);
      toast.error("Failed to create promo code");
    }
  };

  const handleUpdate = async () => {
    if (!formData.code.trim() || !formData.type || !formData.value) {
      toast.error("Code, type, and value are required");
      return;
    }

    try {
      const updateData = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        applicableCategories: formData.applicableCategories
          ? formData.applicableCategories.split(",").map((c) => c.trim())
          : [],
        active: formData.active,
      };

      await sanityClient.patch(editingPromo._id).set(updateData).commit();
      toast.success("Promo code updated successfully");
      resetForm();
      setShowModal(false);
      setEditingPromo(null);
      fetchPromoCodes();
    } catch (err) {
      console.error("❌ Failed to update promo code:", err);
      toast.error("Failed to update promo code");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await sanityClient.delete(id);
      toast.success("Promo code deleted successfully");
      fetchPromoCodes();
    } catch (err) {
      console.error("❌ Failed to delete promo code:", err);
      toast.error("Failed to delete promo code");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await sanityClient.patch(id).set({ active: !currentStatus }).commit();
      toast.success(`Promo code ${!currentStatus ? "activated" : "deactivated"}`);
      fetchPromoCodes();
    } catch (err) {
      console.error("❌ Failed to toggle promo status:", err);
      toast.error("Failed to update promo code status");
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code || "",
      description: promo.description || "",
      type: promo.type || "percentage",
      value: promo.value?.toString() || "",
      maxDiscount: promo.maxDiscount?.toString() || "",
      minOrderAmount: promo.minOrderAmount?.toString() || "",
      usageLimit: promo.usageLimit?.toString() || "",
      expirationDate: promo.expirationDate ? promo.expirationDate.slice(0, 16) : "",
      applicableCategories: promo.applicableCategories?.join(", ") || "",
      active: promo.active !== false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      type: "percentage",
      value: "",
      maxDiscount: "",
      minOrderAmount: "",
      usageLimit: "",
      expirationDate: "",
      applicableCategories: "",
      active: true
    });
    setEditingPromo(null);
  };

  const exportCSV = () => {
    const rows = filteredPromoCodes.map((promo) => {
      const usage = redemptionData[promo.code] || {};
      return {
        Code: promo.code || "N/A",
        Description: promo.description || "",
        Type: promo.type || "N/A",
        Value: promo.type === "percentage" ? `${promo.value}%` : `$${promo.value}`,
        "Min Order": promo.minOrderAmount ? `$${promo.minOrderAmount}` : "N/A",
        "Max Discount": promo.maxDiscount ? `$${promo.maxDiscount}` : "N/A",
        "Usage Limit": promo.usageLimit || "Unlimited",
        "Times Used": usage.count || promo.usedCount || 0,
        "Total Savings": usage.totalSavings ? `$${usage.totalSavings.toFixed(2)}` : "$0.00",
        Status: promo.active ? "Active" : "Inactive",
        Expires: promo.expirationDate ? format(new Date(promo.expirationDate), "yyyy-MM-dd") : "Never",
        Created: promo._createdAt ? format(new Date(promo._createdAt), "yyyy-MM-dd") : "N/A"
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `promo_codes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const isExpired = (expirationDate) => {
    return expirationDate && new Date(expirationDate) < new Date();
  };

  const getUsageCount = (promo) => {
    const firebaseUsage = redemptionData[promo.code]?.count || 0;
    const sanityUsage = promo.usedCount || 0;
    return Math.max(firebaseUsage, sanityUsage);
  };

  const getUsagePercentage = (promo) => {
    if (!promo.usageLimit) return 0;
    const usageCount = getUsageCount(promo);
    return (usageCount / promo.usageLimit) * 100;
  };

  const getTotalSavings = (promo) => {
    return redemptionData[promo.code]?.totalSavings || 0;
  };

  useEffect(() => {
    if (selectedFranchise) {
      fetchPromoCodes();
      fetchRedemptionData();
    }
  }, [selectedFranchise, sortField, sortOrder]);

  useEffect(() => {
    promoCodes.forEach((promo) => {
      const firebaseUsage = redemptionData[promo.code]?.count || 0;
      const sanityUsage = promo.usedCount || 0;
      if (firebaseUsage > sanityUsage) {
        syncUsageToSanity(promo, firebaseUsage);
      }
    });
  }, [promoCodes, redemptionData]);

  useEffect(() => {
    let result = [...promoCodes];

    if (searchQuery) {
      result = result.filter(
        (promo) =>
          promo.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      if (statusFilter === "active") {
        result = result.filter((promo) => promo.active && !isExpired(promo.expirationDate));
      } else if (statusFilter === "inactive") {
        result = result.filter((promo) => !promo.active);
      } else if (statusFilter === "expired") {
        result = result.filter((promo) => isExpired(promo.expirationDate));
      }
    }

    if (typeFilter !== "All") {
      result = result.filter((promo) => promo.type === typeFilter);
    }

    setFilteredPromoCodes(result);
  }, [promoCodes, searchQuery, statusFilter, typeFilter]);

  if (loading) {
    return (
      <div className="admin-promo-codes">
        <p>Loading promo codes...</p>
      </div>
    );
  }

  return (
    <div className="admin-promo-codes">
      <div className="promo-codes-header">
        <h2>🎫 Promo Code Management</h2>
        <button
          onClick={() => {
            fetchPromoCodes();
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
          <p>Please select a franchise to manage promo codes.</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="dashboard-metrics">
              <div className="metric-card">
                <strong>Total Codes:</strong> {promoCodes.length}
              </div>
              <div className="metric-card active">
                <strong>Active:</strong> {promoCodes.filter((p) => p.active).length}
              </div>
              <div className="metric-card expired">
                <strong>Expired:</strong>{" "}
                {promoCodes.filter((p) => isExpired(p.expirationDate)).length}
              </div>
              <div className="metric-card used">
                <strong>Total Uses:</strong> {stats.totalRedemptions}
              </div>
              <div className="metric-card savings">
                <strong>Total Savings:</strong> $
                {stats.totalSavings?.toFixed(2) || "0.00"}
              </div>
              <div className="metric-card avg">
                <strong>Avg Discount:</strong> $
                {stats.averageDiscount?.toFixed(2) || "0.00"}
              </div>
            </div>
          )}

          {stats?.topCodes?.length > 0 && (
            <div className="top-promo-codes">
              <h3>🏆 Top Performing Codes</h3>
              <div className="top-codes-list">
                {stats.topCodes.map((promo, index) => (
                  <div key={index} className="top-code-item">
                    <span className="code-rank">#{index + 1}</span>
                    <span className="code-name">{promo.code}</span>
                    <span className="code-usage">{promo.count} uses</span>
                    <span className="code-savings">
                      ${promo.totalSavings?.toFixed(2) || "0.00"} saved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="promo-codes-controls">
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="_createdAt">Sort by Created</option>
              <option value="expirationDate">Sort by Expiration</option>
              <option value="value">Sort by Value</option>
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
                ➕ Create Promo
              </button>
            )}
            <button onClick={exportCSV} className="export-btn">
              Export CSV ({filteredPromoCodes.length})
            </button>
          </div>

          {filteredPromoCodes.length === 0 ? (
            <div className="no-promo-codes">
              <h3>🎫 No promo codes found</h3>
              <p>No promo codes match your current filters.</p>
              {canEdit && <p>Create your first promo code using the button above.</p>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type & Value</th>
                    <th>Usage & Savings</th>
                    <th>Constraints</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>Created</th>
                    {(canEdit || canDelete) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredPromoCodes.map((promo) => (
                    <tr
                      key={promo._id}
                      className={isExpired(promo.expirationDate) ? "expired-row" : ""}
                    >
                      <td>
                        <div className="promo-code">
                          <strong>{promo.code}</strong>
                          {promo.description && (
                            <div className="promo-description">{promo.description}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="promo-value">
                          <span className={`type-badge type-${promo.type}`}>
                            {promo.type === "percentage"
                              ? `${promo.value}% OFF`
                              : `$${promo.value} OFF`}
                          </span>
                          {promo.maxDiscount && promo.type === "percentage" && (
                            <div className="max-discount">Max: ${promo.maxDiscount}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="usage-info">
                          <strong>{getUsageCount(promo)}</strong>
                          {promo.usageLimit ? ` / ${promo.usageLimit}` : " / ∞"}
                          <div className="savings-amount">
                            ${getTotalSavings(promo).toFixed(2)} saved
                          </div>
                          {promo.usageLimit && (
                            <div className="usage-bar">
                              <div
                                className="usage-fill"
                                style={{ width: `${getUsagePercentage(promo)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="constraints">
                          {promo.minOrderAmount && (
                            <div>Min: ${promo.minOrderAmount}</div>
                          )}
                          {promo.applicableCategories?.length > 0 && (
                            <div>
                              Categories: {promo.applicableCategories.slice(0, 2).join(", ")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            isExpired(promo.expirationDate)
                              ? "status-expired"
                              : promo.active
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {isExpired(promo.expirationDate)
                            ? "Expired"
                            : promo.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {promo.expirationDate ? (
                          <div>
                            <strong>
                              {format(new Date(promo.expirationDate), "MMM d, yyyy")}
                            </strong>
                            <div className="time-remaining">
                              {isExpired(promo.expirationDate)
                                ? "Expired"
                                : formatDistanceToNow(new Date(promo.expirationDate), {
                                    addSuffix: true,
                                  })}
                            </div>
                          </div>
                        ) : (
                          <span className="never-expires">Never</span>
                        )}
                      </td>
                      <td>
                        {promo._createdAt
                          ? formatDistanceToNow(new Date(promo._createdAt), {
                              addSuffix: true,
                            })
                          : "—"}
                      </td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="action-buttons">
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleEdit(promo)}
                                  className="edit-btn"
                                  title="Edit Promo Code"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(promo._id, promo.active)}
                                  className={
                                    promo.active ? "deactivate-btn" : "activate-btn"
                                  }
                                  title={promo.active ? "Deactivate" : "Activate"}
                                >
                                  {promo.active ? "⏸️ Disable" : "▶️ Enable"}
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(promo._id)}
                                className="delete-btn"
                                title="Delete Promo Code"
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
        </>
      )}
    
    {showModal && (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{editingPromo ? "Edit Promo Code" : "Create New Promo Code"}</h3>
            <button
              onClick={() => setShowModal(false)}
              className="close-btn"
            >
              ×
            </button>
          </div>
    
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingPromo ? handleUpdate() : handleCreate();
            }}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="SAVE20"
                  required
                />
              </div>
    
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="20% off all orders"
                />
              </div>
    
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
    
              <div className="form-group">
                <label>
                  {formData.type === "percentage" ? "Percentage *" : "Amount *"}
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder={formData.type === "percentage" ? "20" : "10.00"}
                  min="0"
                  step={formData.type === "percentage" ? "1" : "0.01"}
                  required
                />
              </div>
    
              {formData.type === "percentage" && (
                <div className="form-group">
                  <label>Max Discount ($)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                    placeholder="50.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
    
              <div className="form-group">
                <label>Min Order Amount ($)</label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, minOrderAmount: e.target.value })
                  }
                  placeholder="25.00"
                  min="0"
                  step="0.01"
                />
              </div>
    
              <div className="form-group">
                <label>Usage Limit</label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  placeholder="100"
                  min="1"
                />
              </div>
    
              <div className="form-group">
                <label>Expiration Date</label>
                <input
                  type="datetime-local"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDate: e.target.value })
                  }
                />
              </div>
    
              <div className="form-group full-width">
                <label>Applicable Categories (comma-separated)</label>
                <input
                  type="text"
                  value={formData.applicableCategories}
                  onChange={(e) =>
                    setFormData({ ...formData, applicableCategories: e.target.value })
                  }
                  placeholder="appetizers, mains, desserts"
                />
              </div>
    
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>
            </div>
    
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="save-btn">
                {editingPromo ? "Update" : "Create"} Promo Code
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
  ); 
};

export default AdminPromoCodes;
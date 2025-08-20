import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import "./css/AdminReviewPanel.css";

const AdminReviewPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("All");
  const [filterTargetType, setFilterTargetType] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { user, isSuperAdmin } = useAuth();
  const role = user?.role;
  const canModerate = role === "admin" || role === "superAdmin";

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }

      const response = await fetch(`/api/reviews?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log(`✅ Reviews: Fetched ${data.length} reviews`);
      setReviews(data);
    } catch (err) {
      console.error("❌ Failed to fetch reviews:", err);
      setReviews([]);
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success("Review deleted");
      fetchReviews();
    } catch (err) {
      console.error("❌ Failed to delete review:", err);
      toast.error("Failed to delete review");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedFranchise, selectedLocation]);

  const filteredReviews = reviews
    .filter((review) => {
      if (filterRating !== "All" && review.rating !== parseInt(filterRating)) return false;
      if (filterTargetType !== "All" && review.targetType !== filterTargetType) return false;
      return true;
    })
    .sort((a, b) => {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

  const stats = {
    total: reviews.length,
    averageRating:
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : "0.0",
    byRating: {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    },
  };

  if (loading) {
    return (
      <div className="admin-review-panel">
        <p>Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="admin-review-panel">
      <div className="reviews-header">
        <h2>⭐ Review Management</h2>
        <button onClick={fetchReviews} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {!selectedFranchise ? (
        <div className="no-franchise-selected">
          <h3>🏢 Select a Franchise</h3>
          <p>Please select a franchise to view reviews.</p>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="review-stats">
            <div className="stat-card">
              <h4>Total Reviews</h4>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-card">
              <h4>Average Rating</h4>
              <p className="stat-value">{stats.averageRating} ⭐</p>
            </div>
            <div className="rating-breakdown">
              <h4>Rating Breakdown:</h4>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="rating-bar">
                  <span>{rating}⭐</span>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{
                        width: `${stats.total > 0 ? (stats.byRating[rating] / stats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span>{stats.byRating[rating]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="review-controls">
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
              <option value="All">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <select value={filterTargetType} onChange={(e) => setFilterTargetType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="menu">Menu Items</option>
              <option value="order">Orders</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="no-reviews">
              <h3>📝 No reviews found</h3>
              <p>No reviews match your current filters.</p>
              <p>Try adjusting your filter criteria.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Type</th>
                    <th>Date</th>
                    {canModerate && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <strong>{review.targetId || "Unknown"}</strong>
                        <small>({review.targetType || "N/A"})</small>
                      </td>
                      <td>
                        <div>
                          <strong>{review.customerName || "Anonymous"}</strong>
                          <small>({review.customerType || "guest"})</small>
                        </div>
                      </td>
                      <td>
                        <div className="rating-display">
                          <span className="stars">{"⭐".repeat(review.rating || 0)}</span>
                          <span className="rating-number">{review.rating || 0}/5</span>
                        </div>
                      </td>
                      <td>
                        <div className="comment-cell">{review.comment || "—"}</div>
                      </td>
                      <td>
                        <span className={`type-badge type-${review.customerType}`}>
                          {review.customerType || "guest"}
                        </span>
                      </td>
                      <td>
                        {review.createdAt
                          ? format(new Date(review.createdAt), "MMM d, yyyy")
                          : "—"}
                      </td>
                      {canModerate && (
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => deleteReview(review.id)}
                              className="delete-btn"
                              title="Delete Review"
                            >
                              🗑️ Delete
                            </button>
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
    </div>
  );
};

export default AdminReviewPanel;
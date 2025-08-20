import React, { useEffect, useState } from "react";
import sanityClient from "../sanity/sanityClient.ts";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import "./css/ReviewSection.css";

const ReviewSection = ({ menuItemId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedFranchise || !selectedLocation) return;

      try {
        const query = `
          *[
            _type == "review" &&
            menuItem._ref == $itemId &&
            location._ref == $locationId &&
            franchise._ref == $franchiseId &&
            status == "approved"
          ] | order(_createdAt desc)
        `;
        const data = await sanityClient.fetch(query, {
          itemId: menuItemId,
          locationId: selectedLocation._id,
          franchiseId: selectedFranchise._id,
        });
        setReviews(data);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };
    fetchReviews();
  }, [menuItemId, selectedLocation, selectedFranchise]);

  useEffect(() => {
    const checkPurchase = async () => {
      if (!user?.uid) return;
      try {
        const res = await fetch(`/api/users/${user.uid}`);
        const data = await res.json();
        const allItems = data.purchaseHistory?.flatMap((o) => o.items || []) || [];
        const found = allItems.some((i) => i.id?.includes(menuItemId));
        setHasPurchased(found);
      } catch (err) {
        console.error("Failed to verify purchase:", err);
      }
    };
    checkPurchase();
  }, [user, menuItemId]);

  const handleSubmit = async () => {
    if (!user || !hasPurchased || userRating < 1 || userRating > 5) return;

    if (!selectedFranchise || !selectedLocation) {
      toast.error("Please select a franchise and location first.");
      return;
    }

    if (!userReview.trim()) {
      toast.error("Please write a comment before submitting.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        menuItemId,
        userEmail: user.email,
        rating: userRating,
        comment: userReview.trim(),
        locationId: selectedLocation._id,
        franchiseId: selectedFranchise._id,
      };

      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        setUserReview("");
        toast.success("Review submitted! Awaiting admin approval.");
      } else {
        const error = await res.json();
        toast.error(error?.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Review submission failed:", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-section">
      <h4>Reviews</h4>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div key={r._id} className="review">
            <div className="stars">
              {[...Array(r.rating)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <p>{r.comment}</p>
            <small>— {r.userEmail}</small>
          </div>
        ))
      )}

      {!user ? (
        <p className="auth-reminder">Sign in to leave a review.</p>
      ) : !hasPurchased ? (
        <p className="auth-reminder">You can only review items you purchased.</p>
      ) : submitted ? (
        <p className="submitted-note">Thanks for your feedback! Awaiting approval.</p>
      ) : (
        <div className="submit-review">
          <h5>Leave a Review</h5>
          <select
            value={userRating}
            onChange={(e) => setUserRating(Number(e.target.value))}
            disabled={loading}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} Star{n > 1 && "s"}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Write your thoughts..."
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            disabled={loading}
          />
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
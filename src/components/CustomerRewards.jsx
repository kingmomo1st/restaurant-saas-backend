import React, { useEffect, useState } from "react";
import { firestore } from "../firebase";
import { doc, updateDoc, addDoc, collection, getDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import { useSelector } from "react-redux";
import PromotionService from "../services/PromotionService"; // 🔥 NEW IMPORT
import "./css/CustomerRewards.css";

const builder = imageUrlBuilder(sanityClient);

const CustomerRewards = () => {
  const { user } = useAuth();
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);

  // 🔥 NEW: CMS Promotion Settings
  const [promotionSettings, setPromotionSettings] = useState(null);
  const [tierInfo, setTierInfo] = useState(null);

  // 🔥 NEW: Fetch promotion settings from CMS
  useEffect(() => {
    const fetchPromotionSettings = async () => {
      if (!selectedLocation?._id) return;

      try {
        const settings = await PromotionService.fetchPromotionSettings(selectedLocation._id);
        setPromotionSettings(settings);
        console.log("🏆 Loaded promotion settings for rewards:", settings);
      } catch (error) {
        console.error("❌ Error loading promotion settings:", error);
      }
    };

    fetchPromotionSettings();
  }, [selectedLocation]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userPoints = data.loyaltyPoints || 0;


      setUserData({
        id: docSnap.id,
        ...data,
        points: userPoints,
      });

      // 🔥 NEW: Calculate tier info using CMS settings
      if (promotionSettings) {
        const tier = PromotionService.getTierProgress(userPoints, promotionSettings.loyaltyProgram);
        setTierInfo(tier);
        console.log("🎖️ User tier info:", tier);
      }
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
  setLoading(false);
};

// Only fetch user data after promotion settings are loaded
if (promotionSettings) {
  fetchUserData();
}


}, [user, promotionSettings]);

useEffect(() => {
const fetchRewards = async () => {
try {
const query = `*[_type == "rewardTier" && hidden != true] | order(pointsRequired asc) { _id, title, description, pointsRequired, image, location->{_id} }`;
const results = await sanityClient.fetch(query);
const filtered = selectedFranchise
? results.filter((r) => r.location?._id === selectedFranchise._id)
: results;
setRewards(filtered);
} catch (err) {
console.error("Error fetching CMS rewards:", err);
}
};
fetchRewards();
}, [selectedFranchise]);

const handleRedeem = async (reward) => {
if (!userData) return;
if (!selectedFranchise && !selectedLocation) {
toast.error("Please select a location before redeeming rewards.");
return;
}


if (userData.points < reward.pointsRequired) {
  toast.error("Not enough points to redeem this reward.");
  return;
}

try {
  const userRef = doc(firestore, "users", userData.id);
  const newPointsBalance = userData.points - reward.pointsRequired;

  await updateDoc(userRef, {
    loyaltyPoints: newPointsBalance,
  });

  const location = selectedFranchise || selectedLocation;

  await addDoc(collection(firestore, "rewardRedemptions"), {
    userId: user.uid,
    email: user.email,
    reward: reward.title,
    pointsUsed: reward.pointsRequired,
    timestamp: new Date(),
    locationId: location?._id || null,
    franchiseName: location?.title || null,
  });

  await fetch("/api/rewards/send-redemption-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      rewardTitle: reward.title,
      pointsUsed: reward.pointsRequired,
    }),
  });

  toast.success(`Successfully redeemed: ${reward.title}`);

  // 🔥 UPDATED: Recalculate tier info with new points balance
  setUserData((prev) => ({
    ...prev,
    points: newPointsBalance,
  }));

  if (promotionSettings) {
    const newTierInfo = PromotionService.getTierProgress(newPointsBalance, promotionSettings.loyaltyProgram);
    setTierInfo(newTierInfo);
  }
} catch (err) {
  console.error("Redemption error:", err);
  toast.error("Failed to redeem reward.");
}


};

if (loading) return <p>Loading…</p>;
if (!userData) return <p>User data not found.</p>;
if (!promotionSettings) return <p>Loading loyalty program settings…</p>;

// 🔥 NEW: Use CMS-calculated tier info
const currentTier = tierInfo?.currentTier || "Bronze";
const progress = tierInfo?.progress || 0;
const pointsToNext = tierInfo?.pointsToNext || 0;
const nextTierPoints = tierInfo?.nextTierPoints;

return (
<div className="customer-rewards">
<h2>My Rewards</h2>

```
  {/* 🔥 UPDATED: Enhanced rewards summary with CMS data */}
  <div className="rewards-summary" style={{
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px"
  }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", textAlign: "center" }}>
      <div>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Points Balance</h3>
        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{userData.points}</p>
      </div>
      
      <div>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Current Tier</h3>
        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{currentTier}</p>
      </div>
      
      <div>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Points per $1</h3>
        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
          {promotionSettings.loyaltyProgram.pointsPerDollar}
        </p>
      </div>
    </div>

    {/* 🔥 NEW: Dynamic progress bar based on CMS tiers */}
    {nextTierPoints && (
      <div style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span>Progress to {tierInfo.currentTier === "Bronze" ? "Silver" : tierInfo.currentTier === "Silver" ? "Gold" : "Platinum"}</span>
          <span>{pointsToNext} points to go</span>
        </div>
        <div className="progress-bar" style={{
          width: "100%",
          height: "12px",
          backgroundColor: "rgba(255,255,255,0.3)",
          borderRadius: "6px",
          overflow: "hidden"
        }}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "rgba(255,255,255,0.8)",
              borderRadius: "6px",
              transition: "width 0.3s ease"
            }} 
          />
        </div>
      </div>
    )}

    {currentTier === "Platinum" && (
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
          🏆 You've reached the highest tier! Congratulations!
        </p>
      </div>
    )}
  </div>

  {/* 🔥 NEW: Loyalty Program Info */}
  {promotionSettings.loyaltyProgram.enabled && (
    <div className="loyalty-info" style={{
      backgroundColor: "#f8f9fa",
      border: "1px solid #dee2e6",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "30px"
    }}>
      <h3>🏆 Loyalty Program Details</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h4>How to Earn Points:</h4>
          <p>• {promotionSettings.loyaltyProgram.pointsPerDollar} point per $1 spent</p>
          <p>• Points added automatically after each order</p>
          <p>• No expiration on points</p>
        </div>
        <div>
          <h4>How to Redeem:</h4>
          <p>• {promotionSettings.loyaltyProgram.rewardThreshold} points = $1 value</p>
          <p>• Use points during checkout</p>
          <p>• Stack with other promotions</p>
        </div>
      </div>
    </div>
  )}

  <h3>Redeem Your Points</h3>
  <div className="reward-grid">
    {rewards.map((reward) => (
      <div className="reward-card" key={reward._id} style={{
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: userData.points >= reward.pointsRequired ? "#fff" : "#f8f9fa",
        opacity: userData.points >= reward.pointsRequired ? 1 : 0.7
      }}>
        {reward.image && (
          <img
            src={builder.image(reward.image).width(100).height(100).url()}
            alt={reward.title}
            className="reward-img"
            style={{ borderRadius: "8px", marginBottom: "10px" }}
          />
        )}
        <h4 style={{ margin: "10px 0" }}>{reward.title}</h4>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>{reward.description}</p>
        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff", marginBottom: "15px" }}>
          {reward.pointsRequired} points
        </p>
        <button
          onClick={() => handleRedeem(reward)}
          disabled={userData.points < reward.pointsRequired}
          style={{
            width: "100%",
            padding: "10px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: userData.points >= reward.pointsRequired ? "#28a745" : "#6c757d",
            color: "white",
            cursor: userData.points >= reward.pointsRequired ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {userData.points >= reward.pointsRequired ? "Redeem" : "Not Enough Points"}
        </button>
      </div>
    ))}
  </div>

  {rewards.length === 0 && (
    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
      <p>No rewards available at this location yet.</p>
      <p>Keep earning points - rewards coming soon!</p>
    </div>
  )}
</div>


);
};

export default CustomerRewards;
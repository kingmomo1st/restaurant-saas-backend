import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { firestore } from "../firebase";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CustomerRewards from "./CustomerRewards";
import PromotionService from "../services/PromotionService"; // 🔥 NEW IMPORT
import "./css/Dashboard.css";

function Dashboard() {
const { user, isAdmin, logout, loading } = useAuth();
const selectedLocation = useSelector((state) => state.location.selectedLocation); // 🔥 NEW

const [points, setPoints] = useState(0);
const [history, setHistory] = useState([]);
const [giftcardRedemptions, setGiftcardRedemptions] = useState([]);
const [name, setName] = useState("");
const [orderStatus, setOrderStatus] = useState("");

// 🔥 NEW: CMS Promotion Settings
const [promotionSettings, setPromotionSettings] = useState(null);
const [tierInfo, setTierInfo] = useState(null);

const navigate = useNavigate();

// 🔥 NEW: Fetch promotion settings from CMS
useEffect(() => {
const fetchPromotionSettings = async () => {
if (!selectedLocation?._id) return;


  try {
    const settings = await PromotionService.fetchPromotionSettings(selectedLocation._id);
    setPromotionSettings(settings);
    console.log("🏆 Dashboard: Loaded promotion settings:", settings);
  } catch (error) {
    console.error("❌ Dashboard: Error loading promotion settings:", error);
  }
};

fetchPromotionSettings();


}, [selectedLocation]);

// 🔥 UPDATED: Calculate tier info when points or settings change
useEffect(() => {
if (promotionSettings && points > 0) {
const tier = PromotionService.getTierProgress(points, promotionSettings.loyaltyProgram);
setTierInfo(tier);
console.log("🎖️ Dashboard: User tier info:", tier);
}
}, [points, promotionSettings]);

useEffect(() => {
if (!loading && !user) navigate("/signin");
if (!loading && isAdmin) navigate("/admin");
}, [user, isAdmin, loading, navigate]);

useEffect(() => {
if (user && !isAdmin) {
const fetchUserData = async () => {
try {
const docRef = doc(firestore, "users", user.uid);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
const data = docSnap.data();
setPoints(data.loyaltyPoints || 0);
setHistory(data.purchaseHistory || []);
setGiftcardRedemptions(data.giftcardRedemptions || []);
setName(data.firstName || user.email.split("@")[0]);
}
} catch (error) {
console.error("Error fetching dashboard data:", error);
}
};
fetchUserData();
}
}, [user, isAdmin]);



// 🔥 NEW: Use CMS-calculated tier info with fallbacks
const tier = tierInfo?.currentTier || "Bronze";
const nextTierPoints = tierInfo?.nextTierPoints;
const progress = tierInfo?.progress || 0;
const pointsToNext = tierInfo?.pointsToNext || 0;

useEffect(() => {
if (!user) return;
const unsub = onSnapshot(
collection(firestore, "liveOrders"),
(snapshot) => {
snapshot.docChanges().forEach((change) => {
const data = change.doc.data();
if (data.userId === user.uid && change.type === "modified") {
setOrderStatus(data.status);
toast.info(`Your order is now "${data.status}"`);
}
});
}
);
return () => unsub();
}, [user]);

const latestOrder = history[0];
const shouldPromptReview = latestOrder && !latestOrder.reviewed;

if (loading || !user || isAdmin) return <p>Loading dashboard…</p>;

return (
<div className="dashboard-container">
<h2>Welcome back, {name}!</h2>


  {/* 🔥 UPDATED: Enhanced loyalty section with CMS data */}
  <div className="loyalty-section" style={{
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px"
  }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", textAlign: "center" }}>
      <div>
        <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>Current Points</h3>
        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{points}</p>
      </div>
      
      <div>
        <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>Tier Status</h3>
        <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{tier}</p>
      </div>
      
      {promotionSettings && (
        <div>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>Earn Rate</h3>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {promotionSettings.loyaltyProgram.pointsPerDollar}pt/$1
          </p>
        </div>
      )}
    </div>

    {/* 🔥 UPDATED: Dynamic progress bar based on CMS */}
    {nextTierPoints && (
      <div style={{ marginTop: "15px" }}>
        <div className="progress-wrapper">
          <div className="progress-bar" style={{
            width: "100%",
            height: "10px",
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: "5px",
            overflow: "hidden"
          }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`,
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.8)",
                borderRadius: "5px",
                transition: "width 0.3s ease"
              }} 
            />
          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: "14px", textAlign: "center" }}>
            {pointsToNext} pts to {tier === "Bronze" ? "Silver" : tier === "Silver" ? "Gold" : "Platinum"} Tier
          </p>
        </div>
      </div>
    )}

    {tier === "Platinum" && (
      <p style={{ margin: "10px 0 0 0", textAlign: "center", fontSize: "16px", fontWeight: "bold" }}>
        🏆 Highest tier achieved!
      </p>
    )}
  </div>

  {/* 🔥 NEW: Show CMS loyalty program info if enabled */}
  {promotionSettings?.loyaltyProgram?.enabled && (
    <div style={{
      backgroundColor: "#f8f9fa",
      border: "1px solid #dee2e6", 
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "20px"
    }}>
      <h4 style={{ margin: "0 0 10px 0" }}>💰 Your Rewards Program</h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "14px" }}>
        <div>
          <strong>Earn:</strong> {promotionSettings.loyaltyProgram.pointsPerDollar} point per $1 spent
        </div>
        <div>
          <strong>Redeem:</strong> {promotionSettings.loyaltyProgram.rewardThreshold} points = $1 value
        </div>
      </div>
    </div>
  )}

  {history.length >= 5 && (
    <p className="thank-you-badge">Thank you for being a loyal customer!</p>
  )}

  {shouldPromptReview && (
    <div className="review-prompt">
      <p>We'd love your feedback on your last order!</p>
      <Link to={`/order-online?review=${latestOrder.orderId}`} className="btn">Leave a Review</Link>
    </div>
  )}

  <div className="dashboard-actions">
    <Link to="/menu" className="btn">Explore Menu</Link>
    <button onClick={logout} className="btn logout">Log Out</button>
  </div>

  <h3>Purchase History</h3>
  {history.length > 0 ? (
    <ul className="purchase-history">
      {history.map((entry, index) => (
        <li key={index} style={{ 
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "10px"
        }}>
          <p><strong>Order ID:</strong> {entry.orderId}</p>
          <p><strong>Total:</strong> ${entry.total?.toFixed(2)}</p>
          
          {/* 🔥 UPDATED: Show detailed promotion info from order history */}
          {entry.pointsEarned && (
            <p><strong>Points Earned:</strong> {entry.pointsEarned}</p>
          )}
          {entry.pointsUsed > 0 && (
            <p><strong>Points Used:</strong> {entry.pointsUsed}</p>
          )}
          {entry.promoCode && (
            <p><strong>Promo Code:</strong> {entry.promoCode}</p>
          )}
          {entry.happyHourDiscount > 0 && (
            <p><strong>Happy Hour Savings:</strong> ${entry.happyHourDiscount.toFixed(2)}</p>
          )}
          
          <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
        </li>
      ))}
    </ul>
  ) : (
    <p>You haven't made any purchases yet.</p>
  )}

  <h3>Your Gift Card Redemptions</h3>
  {giftcardRedemptions.length > 0 ? (
    <ul className="purchase-history">
      {giftcardRedemptions.map((entry, index) => (
        <li key={index}>
          <p><strong>Gift Code:</strong> {entry.giftCode}</p>
          <p><strong>Amount Used:</strong> ${entry.amount.toFixed(2)}</p>
          <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
        </li>
      ))}
    </ul>
  ) : (
    <p>No gift card redemptions yet.</p>
  )}

  {/* ✅ Keep the customer rewards panel */}
  <CustomerRewards points={points} setPoints={setPoints} />
</div>


);
}

export default Dashboard;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateItemQuantity, setOrderType } from "../redux/cartSlice";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import PromotionService from "../services/PromotionService" // 🔥 NEW IMPORT
import "./css/CheckoutPage.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutPage() {
  const cart = useSelector((state) => state.cart.items);
  const promo = useSelector((state) => state.promo);
  const orderType = useSelector((state) => state.cart.orderType);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const selectedTableId = useSelector((state) => state.location.selectedTableId);

  const dispatch = useDispatch();
  const { user } = useAuth();

  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // 🔥 NEW: CMS Promotion Settings State
  const [promotionSettings, setPromotionSettings] = useState(null);
  const [happyHourActive, setHappyHourActive] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

// 🔥 NEW: Fetch promotion settings from CMS
useEffect(() => {
const fetchPromotions = async () => {
if (!selectedLocation?._id) return;


  try {
    const settings = await PromotionService.fetchPromotionSettings(selectedLocation._id);
    setPromotionSettings(settings);
    
    // Check if happy hour is active
    const isActive = PromotionService.isHappyHourActive(settings.happyHour);
    setHappyHourActive(isActive);
    
    console.log("🎉 Promotion settings loaded:", settings);
    console.log("🍷 Happy hour active:", isActive);
    
    if (isActive) {
      toast.success(`🍷 Happy Hour is active! ${settings.happyHour.discount}% off!`);
    }
  } catch (error) {
    console.error("❌ Error loading promotion settings:", error);
  }
};

fetchPromotions();


}, [selectedLocation]);

useEffect(() => {
const fetchPoints = async () => {
if (!user) return;
try {
const docRef = doc(firestore, "users", user.uid);
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
const data = docSnap.data();
setAvailablePoints(data.loyaltyPoints || 0);
} else {
setAvailablePoints(0);
}
} catch (error) {
console.error("Error fetching user points:", error);
setAvailablePoints(0);
}
};
fetchPoints();
}, [user]);

const handleChange = useCallback((e) => {
setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
}, []);

const handleQuantityChange = useCallback((item, newQuantity) => {
dispatch(
updateItemQuantity({
id: item.id,
size: item.size || "default",
modifiers: item.modifiers || [],
quantity: newQuantity,
})
);
}, [dispatch]);

const handleOrderTypeChange = useCallback((type) => {
dispatch(setOrderType(type));
toast.success(`Order type changed to ${type}`);
}, [dispatch]);

// Memoized calculations with CMS integration
const subtotal = useMemo(() =>
cart.reduce((total, item) => total + item.price * item.quantity, 0),
[cart]
);

// 🔥 NEW: Happy Hour Discount from CMS
const happyHourDiscount = useMemo(() => {
if (!promotionSettings || !happyHourActive) return 0;
return PromotionService.calculateHappyHourDiscount(subtotal, promotionSettings.happyHour);
}, [promotionSettings, happyHourActive, subtotal]);

const promoDiscount = useMemo(() => {
if (!promo.code) return 0;
if (promo.minOrderAmount && subtotal < promo.minOrderAmount) return 0;
if (promo.discountType === "percentage") {
return (promo.discountValue / 100) * subtotal;
}
if (promo.discountType === "fixed") {
return promo.discountValue;
}
return 0;
}, [promo, subtotal]);

const deliveryFee = useMemo(() => {
if (!selectedLocation || orderType === "pickup") return 0;
return selectedLocation.deliveryFee || 0;
}, [selectedLocation, orderType]);

const taxAmount = useMemo(() => {
const taxRate = selectedLocation?.taxRate || 0;
const taxable = subtotal - happyHourDiscount - promoDiscount; // 🔥 Include happy hour
return orderType === "pickup" ? 0 : (taxable * taxRate) / 100;
}, [selectedLocation, subtotal, happyHourDiscount, promoDiscount, orderType]);

// 🔥 UPDATED: Points redemption using CMS settings
const pointsToRedeem = useMemo(() => {
if (!redeemPoints || !promotionSettings) return 0;


const afterDiscounts = Math.max(0, subtotal - happyHourDiscount - promoDiscount);
const pointsValue = PromotionService.calculatePointsValue(
  availablePoints, 
  promotionSettings.loyaltyProgram
);

return Math.min(pointsValue, afterDiscounts);


}, [redeemPoints, subtotal, happyHourDiscount, promoDiscount, availablePoints, promotionSettings]);

const actualPointsUsed = useMemo(() => {
if (!redeemPoints || !promotionSettings) return 0;
return Math.round(pointsToRedeem * promotionSettings.loyaltyProgram.rewardThreshold);
}, [redeemPoints, pointsToRedeem, promotionSettings]);

const effectiveTotal = useMemo(() => {
const afterDiscounts = Math.max(0, subtotal - happyHourDiscount - promoDiscount - pointsToRedeem);
return (afterDiscounts + deliveryFee + taxAmount).toFixed(2);
}, [subtotal, happyHourDiscount, promoDiscount, pointsToRedeem, deliveryFee, taxAmount]);

// 🔥 NEW: Calculate points that will be earned from this order
const pointsToEarn = useMemo(() => {
if (!promotionSettings) return 0;
const orderTotal = parseFloat(effectiveTotal);
return PromotionService.calculatePointsEarned(orderTotal, promotionSettings.loyaltyProgram);
}, [effectiveTotal, promotionSettings]);

const handleSubmit = async (e) => {
e.preventDefault();


if (cart.length === 0) {
  toast.error("Your cart is empty.");
  return;
}
if (!orderType) {
  toast.error("Please select pickup or delivery.");
  return;
}

if (orderType === "delivery") {
  const requiredFields = [
    "firstName",
    "lastName",
    "address",
    "city",
    "state",
    "zipCode",
    "phone",
  ];
  const missing = requiredFields.filter((field) => !formData[field]);
  if (missing.length) {
    toast.error(`Please fill in: ${missing.join(", ")}`);
    return;
  }
  if (!/^\d{10,15}$/.test(formData.phone)) {
    toast.error("Please enter a valid phone number.");
    return;
  }
} else {
  if (!formData.firstName || !formData.lastName || !formData.phone) {
    toast.error("Please provide your name and phone number for pickup orders.");
    return;
  }
}

try {
  const stripe = await stripePromise;
  const res = await fetch("http://localhost:5001/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cart,
      userId: user?.uid,
      userEmail: user?.email,
      shippingAddress: orderType === "delivery" ? formData : null,
      customerInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      },
      total: subtotal,
      promoCode: promo.code || null,
      promoDiscount: promoDiscount,
      // 🔥 NEW: Happy hour discount
      happyHourDiscount: happyHourDiscount,
      happyHourActive: happyHourActive,
      redeemPoints,
      pointsUsed: actualPointsUsed,
      // 🔥 NEW: Points to be earned
      pointsToEarn: pointsToEarn,
      deliveryFee: deliveryFee,
      taxAmount: taxAmount,
      orderType,
      locationId: selectedLocation?._id,
      tableId: selectedTableId || null,
      // 🔥 NEW: Include promotion settings for backend
      promotionSettings: promotionSettings
    }),
  });

  const session = await res.json();
  if (!res.ok) {
    toast.error(session.message || "Checkout failed");
    return;
  }

  const result = await stripe.redirectToCheckout({ sessionId: session.id });
  if (result.error) {
    toast.error(result.error.message);
  }
} catch (err) {
  console.error("Checkout error:", err);
  toast.error("Something went wrong. Please try again.");
}


};

if (!orderType) {
return (
<div className="checkout-container">
<h2>Checkout</h2>
<div className="order-type-required">
<h3>Please select your order type first</h3>
<p>You need to choose between pickup or delivery before proceeding.</p>
<div className="order-type-selection">
<button
className="order-type-btn pickup"
onClick={() => handleOrderTypeChange("pickup")}
>
🏪 Pickup
</button>
<button
className="order-type-btn delivery"
onClick={() => handleOrderTypeChange("delivery")}
>
🚚 Delivery
</button>
</div>
</div>
</div>
);
}

return (
<div className="checkout-container">
<h2>Checkout</h2>


  {/* 🔥 NEW: Happy Hour Banner */}
  {happyHourActive && promotionSettings && (
    <div className="happy-hour-banner" style={{
      backgroundColor: "#fff3cd",
      border: "1px solid #ffeaa7",
      borderRadius: "8px",
      padding: "15px",
      margin: "20px 0",
      textAlign: "center"
    }}>
      <h3 style={{ color: "#856404", margin: "0 0 10px 0" }}>
        🍷 Happy Hour Active!
      </h3>
      <p style={{ color: "#856404", margin: 0 }}>
        Enjoy {promotionSettings.happyHour.discount}% off your order! 
        Valid until {promotionSettings.happyHour.endTime}
      </p>
    </div>
  )}
  
  <div className="order-type-display">
    <h3>
      Order Type:{" "}
      <span className={`order-type-badge ${orderType}`}>
        {orderType === "pickup" ? "🏪 Pickup" : "🚚 Delivery"}
      </span>
    </h3>
    <button
      className="change-order-type"
      onClick={() =>
        dispatch(setOrderType(orderType === "pickup" ? "delivery" : "pickup"))
      }
    >
      Switch to {orderType === "pickup" ? "Delivery" : "Pickup"}
    </button>
  </div>

  <form onSubmit={handleSubmit} className="checkout-form">
    <div className="customer-info-section">
      <h3>Customer Information</h3>
      <div className="form-group">
        <label>First Name *</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Last Name *</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Phone Number *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>
    </div>

    {orderType === "delivery" && (
      <div className="delivery-info-section">
        <h3>Delivery Address</h3>
        <div className="form-group">
          <label>Street Address *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Apartment/Suite (Optional)</label>
          <input
            type="text"
            name="apartment"
            value={formData.apartment}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>State *</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>ZIP Code *</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
          />
        </div>
      </div>
    )}

    {user && promotionSettings && (
      <div className="loyalty-info" style={{
        backgroundColor: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0"
      }}>
        <h4>🏆 Loyalty Rewards</h4>
        <p>
          You have <strong>{availablePoints}</strong> loyalty points
          {promotionSettings.loyaltyProgram.enabled && (
            <span> (${PromotionService.calculatePointsValue(availablePoints, promotionSettings.loyaltyProgram).toFixed(2)} value)</span>
          )}
        </p>
        
        {pointsToEarn > 0 && (
          <p style={{ color: "#28a745", fontWeight: "bold" }}>
            💰 This order will earn you {pointsToEarn} points!
          </p>
        )}
        
        {promotionSettings.loyaltyProgram.enabled && availablePoints > 0 && (
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              checked={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.checked)}
            />
            Redeem points for this order (${pointsToRedeem.toFixed(2)} discount)
          </label>
        )}
      </div>
    )}

    <h3>Cart Summary</h3>
    <div className="cart-summary">
      {cart.map((item) => (
        <div
          key={`${item.id}_${item.size || "default"}_${JSON.stringify(
            item.modifiers || []
          )}`}
          className="cart-item"
        >
          <span>{item.name}</span>
          {item.modifiers?.length > 0 && (
            <ul className="modifiers-list">
              {item.modifiers.map((mod, i) => (
                <li key={i}>
                  + {mod.name}
                  {mod.price ? ` ($${mod.price.toFixed(2)})` : ""}
                </li>
              ))}
            </ul>
          )}
          <input
            type="number"
            value={item.quantity}
            min="1"
            onChange={(e) =>
              handleQuantityChange(item, parseInt(e.target.value))
            }
          />
          <span>
            @ ${item.price.toFixed(2)} = $
            {(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      ))}
    </div>

    <div className="order-summary">
      <div className="summary-line">
        <span>Subtotal:</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      
      {/* 🔥 NEW: Happy Hour Discount */}
      {happyHourDiscount > 0 && (
        <div className="summary-line happy-hour-line" style={{ color: "#d4ac0d" }}>
          <span>🍷 Happy Hour ({promotionSettings.happyHour.discount}%):</span>
          <span>- ${happyHourDiscount.toFixed(2)}</span>
        </div>
      )}
      
      {promo.code && (
        <div className="summary-line promo-line">
          <span>Promo ({promo.code}):</span>
          <span>- ${promoDiscount.toFixed(2)}</span>
        </div>
      )}
      
      {/* 🔥 NEW: Loyalty Points Discount */}
      {pointsToRedeem > 0 && (
        <div className="summary-line loyalty-line" style={{ color: "#27ae60" }}>
          <span>🏆 Loyalty Points ({actualPointsUsed} pts):</span>
          <span>- ${pointsToRedeem.toFixed(2)}</span>
        </div>
      )}
      
      <div className="summary-line">
        <span>Delivery Fee:</span>
        <span>${deliveryFee.toFixed(2)}</span>
      </div>
      <div className="summary-line">
        <span>Tax:</span>
        <span>${taxAmount.toFixed(2)}</span>
      </div>
      <div className="summary-line total-line">
        <span><strong>Total:</strong></span>
        <span><strong>${effectiveTotal}</strong></span>
      </div>
    </div>

    <button type="submit" className="place-order-btn">
      Place Order - ${effectiveTotal}
    </button>
  </form>
</div>


);
}

export default CheckoutPage;
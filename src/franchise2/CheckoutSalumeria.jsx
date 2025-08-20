import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useCart } from "../components/CartContext";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../components/AuthContext";
import "./css/CheckoutSalumeria.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutSalumeria() {
  const { cart, updateCart } = useCart();
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedTableId = useSelector((state) => state.location.selectedTableId);
  const { user } = useAuth();

  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [useGiftCard, setUseGiftCard] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !selectedLocation?._id) return;
      try {
        const res = await fetch(`/api/users/${user.uid}?locationId=${selectedLocation._id}`);
        const data = await res.json();
        setAvailablePoints(data.points || 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user, selectedLocation]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    updateCart(itemId, newQuantity);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getDeliveryFee = () => {
    if (!selectedLocation || deliveryMethod === "pickup") return 0;
    return selectedLocation.deliveryFee || 0;
  };

  const getTaxAmount = () => {
    const taxRate = selectedLocation?.taxRate || 0;
    const taxable = calculateSubtotal() - promoDiscount;
    return deliveryMethod === "pickup" ? 0 : (taxable * taxRate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = getDeliveryFee();
    const taxAmount = getTaxAmount();
    const loyaltyDiscount = redeemPoints ? Math.min(availablePoints, subtotal) : 0;
    const giftCardDiscount = useGiftCard ? Math.min(giftCardBalance, subtotal) : 0;

    return Math.max(
      0,
      subtotal - promoDiscount - loyaltyDiscount - giftCardDiscount + deliveryFee + taxAmount
    );
  };

  const validateGiftCard = async () => {
    if (!giftCardCode || !user?.email) return;
    try {
      const response = await fetch("/api/giftcards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          giftCode: giftCardCode.toUpperCase(),
          locationId: selectedLocation._id,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setGiftCardBalance(result.remainingAmount || 0);
        setUseGiftCard(true);
      } else {
        alert(result.error || "Invalid gift card");
        setGiftCardBalance(0);
        setUseGiftCard(false);
      }
    } catch (error) {
      console.error("Gift card validation error:", error);
      alert("Failed to validate gift card");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) return alert("Your cart is empty.");
    if (!selectedLocation?._id || !selectedFranchise?._id) return alert("Please select a location first.");

    const requiredFields = ["firstName", "lastName", "phone"];
    if (deliveryMethod === "delivery") {
      requiredFields.push("address", "city", "state", "zipCode");
    }

    const missing = requiredFields.filter((field) => !formData[field]);
    if (missing.length) return alert(`Please fill in: ${missing.join(", ")}`);

    if (!/^\d{10,15}$/.test(formData.phone)) return alert("Please enter a valid phone number.");

    try {
      const stripe = await stripePromise;

      const checkoutData = {
        cart,
        userId: user?.uid,
        userEmail: user?.email,
        shippingAddress: formData,
        total: calculateTotal(),
        promoCode: promoCode || null,
        promoDiscount,
        redeemPoints,
        pointsUsed: redeemPoints ? Math.min(availablePoints, calculateSubtotal()) : 0,
        giftCardCode: useGiftCard ? giftCardCode : null,
        giftCardAmount: useGiftCard ? Math.min(giftCardBalance, calculateSubtotal()) : 0,
        deliveryFee: getDeliveryFee(),
        taxAmount: getTaxAmount(),
        deliveryMethod,
        locationId: selectedLocation._id,
        franchiseId: selectedFranchise._id,
        tableId: selectedTableId || null,
      };

      const res = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });

      const session = await res.json();
      if (!res.ok) return alert(session.message || "Checkout failed");

      const result = await stripe.redirectToCheckout({ sessionId: session.id });
      if (result.error) alert(result.error.message);
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  if (!selectedLocation || !selectedFranchise) {
    return (
      <div className="checkout-container">
        <h2>Please select a location first</h2>
      </div>
    );
  }

  // ✨ Keep the form JSX as-is (already clean in your original) unless you want style upgrades

  return (
    <div className="checkout-salumeria-container">
      {/* ... Keep all your existing JSX here (already clean) */}
    </div>
  );
}

export default CheckoutSalumeria;
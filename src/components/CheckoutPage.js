import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateItemQuantity } from "../redux/cartSlice";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "./AuthContext";
import "./css/CheckoutPage.css";

const stripePromise = loadStripe("pk_test_51R5OCy2MBfempGzHWVggT1NjsVZaQZ7bgPMWfgwvBoYV7QKFuiQf42AJtbSGXoGrw6iebcEw2nhxrzYaCJDDZ3Ew00QOWN6yy5");

function CheckoutPage() {
  const cart = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsUsed, setPointsUsed] = useState(0);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", address: "", apartment: "",
    city: "", state: "", zipCode: "", phone: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuantityChange = (id, newQuantity) => {
    dispatch(updateItemQuantity({ id, quantity: newQuantity }));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const effectiveTotal = () => {
    const rawTotal = calculateTotal();
    return redeemPoints
      ? Math.max(0, rawTotal - Math.min(availablePoints, rawTotal)).toFixed(2)
      : rawTotal.toFixed(2);
  };

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/users/${user.uid}`);
        const data = await res.json();
        setAvailablePoints(data.points || 0);
      } catch (error) {
        console.error("Error fetching user points:", error);
      }
    };
    fetchPoints();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty.");

    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'];
    const missing = requiredFields.filter(field => !formData[field]);
    if (missing.length) return alert("Please fill in all required fields.");

    if (!/^\d{10,15}$/.test(formData.phone)) {
      return alert("Please enter a valid phone number.");
    }

    const total = calculateTotal();
    const pointsToUse = redeemPoints ? Math.min(availablePoints, total) : 0;

    try {
      const stripe = await stripePromise;
      const res = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          userId: user?.uid,
          userEmail: user?.email,
          shippingAddress: formData,
          total,
          redeemPoints,
          pointsUsed: pointsToUse
        }),
      });

      const session = await res.json();
      if (!res.ok) return alert(session.message || "Stripe error");

      const result = await stripe.redirectToCheckout({ sessionId: session.id });
      if (result.error) alert(result.error.message);

    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit} className="checkout-form">
        {['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'].map(field => (
          <div className="form-group" key={field}>
            <label>{field.replace(/([A-Z])/g, " $1")}</label>
            <input type="text" name={field} value={formData[field]} onChange={handleChange} required />
          </div>
        ))}

        {user && (
          <div className="loyalty-info">
            <p>You have <strong>{availablePoints}</strong> loyalty points</p>
            <label>
              <input
                type="checkbox"
                checked={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.checked)}
              /> Redeem points for this order
            </label>
            {redeemPoints && (
              <p>Redeeming <strong>{Math.min(availablePoints, calculateTotal())}</strong> points</p>
            )}
          </div>
        )}

        <h3>Cart Summary</h3>
        <div className="cart-summary">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <span>{item.name}</span>
              <input
                type="number"
                value={item.quantity}
                min="1"
                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
              />
              <span>@ ${item.price.toFixed(2)} = ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <h3>Total: ${effectiveTotal()}</h3>
        <button type="submit">Place Order</button>
      </form>
    </div>
  );
}

export default CheckoutPage;
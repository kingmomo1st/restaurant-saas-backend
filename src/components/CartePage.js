import React from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    clearCart,
    removeFromCart,
    updateItemQuantity
} from "../redux/cartSlice";

import "./css/CartePage.css"
import { Link} from "react-router-dom";
import {toast , ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CartPage(){
    const cart= useSelector((state)=>state.cart.items);
    const dispatch= useDispatch();
    
    const calculateTotal= ()=>{
        return cart.reduce((total,item) => total + (typeof item.price==="number"? item.price * item.quantity:0),0).toFixed(2);
    };

    const handleQuantityChange= (id, size, newQuantity)=>{
        if(newQuantity<1) return;
        dispatch(updateItemQuantity({id,size, quantity: newQuantity}));
        toast.success("Quantity updated")
    };

    const handleRemoveItem= (id,size)=>{
        dispatch(removeFromCart({id,size}));
        toast.info("Item removed from cart.")
    };

    const handleClearCart= ()=>{
        dispatch(clearCart());
        toast.warn("Cart cleared.")
    };

if(cart.length ===0){
    return(
        <div className="empty-cart">
            <h2> Your Cart is empty</h2>
            <Link to="/menu" className="back-to-menu-btn"> Back to Menu</Link>
        </div>
    )}
        console.log("Item ids in cart:", cart.map(item=>item.id));

    return (
        <div className="cart-page-container">
            <ToastContainer/>
            <h2>Your Cart</h2> 
        <div> 
                  
            {cart.map((item)=>(
            <div key={`${item.id}_${item.size ||"default"}`} className="cart-item fade-in" style={{borderBottom:"1px solid #ddd",paddingBottom:"10px", marginBottom:"10px"}}>
                <img src={item.imageURL || "https://via.placeholder.com/150"} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                <h3>{item.name} ({item.size || "Regular"})</h3>
                <p>Unit Price: ${typeof item.price==="number"? item.price.toFixed(2): "N/A"}</p>

                <div className="quantity-controls">
                    <button onClick={()=> handleQuantityChange(item.id, item.size, item.quantity-1)} disabled={item.quantity===1}> {""}-{""} </button>
                    <input
                        type="number"
                        value={item.quantity}
                        onChange={(e)=> handleQuantityChange(item.id, item.size, parseInt(e.target.value))} min="1"/>
                    <button onClick={()=>handleQuantityChange(item.id, item.size, item.quantity+1)}> {""}+{""}</button>
                </div>
                    <p> <strong> Subtotal:</strong>${(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={()=> handleRemoveItem(item.id, item.size)}>Remove</button>
            </div>
            </div>
            
            ))}
        <div className="cart-total" style={{marginTop:"20px", textAlign:"right"}}>
            <h3> Total: ${calculateTotal()}</h3>
            <button onClick={handleClearCart} className="clear-cart-button">Clear Cart</button>
        </div>
            <Link to="/menu" className="back-to-menu-btn"> Continue Shopping</Link>
            <Link to="/checkout" className="checkout-btn"> Proceed to Checkout </Link>
            

        </div>

        </div>

    );
}

    export default CartPage;
        
    









import React, {useState} from 'react';
import "./css/RedeemGiftCard.css"

const RedeemGiftCard= ()=>{
    const [email, setEmail]= useState("");
    const [redeemMessage, setRedeemMessage]= useState("");
    const [error, setError]= useState("");

    const handleRedeem= async (e)=> {
        e.preventDefault();
        setRedeemMessage("");
        setError("");
    
    
    try {
        const res= await fetch("/api/giftcards/redeem", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email}),
        });

        const data= await res.json();
        if(!res.ok) throw new Error(data.error || "Redemption failed");

        setRedeemMessage(`Gift card redeemed: $${data.amount.toFixed(2)}`);
        setEmail("");
        
    } catch (error) {
        setError(error.message);
        
    }

};

return (
    <div className="giftcard-container">
    <h2>Redeem Gift Card</h2>
    <form onSubmit={handleRedeem} className="giftcard-form">
      <div className="form-group">
        <label>Enter your email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" className="giftcard-submit">Redeem</button>
      {redeemMessage && <p className="success-msg">{redeemMessage}</p>}
      {error && <p className="error-msg">{error}</p>}
    </form>
  </div>
);
};

export default RedeemGiftCard;






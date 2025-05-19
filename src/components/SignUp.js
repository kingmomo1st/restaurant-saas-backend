import React, { useState } from "react";
import { useNavigate, Link} from "react-router-dom";
import { useAuth } from "./AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../firebase";
import "./css/Auth.css";

function SignUp() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await register(email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        points: 0,
        purchaseHistory: [],
        createdAt: serverTimestamp(),
      });

      alert("Registration successful");
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Sign Up</button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/signin">Sign in</Link>
      </p>

      <button className="back-home-btn" onClick={() => navigate("/")}>
        Go Back Home
      </button>
    </div>
  );
}

export default SignUp;
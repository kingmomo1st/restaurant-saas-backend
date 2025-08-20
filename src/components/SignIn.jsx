import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./css/Auth.css";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!loading && user && !redirected) {
      navigate("/dashboard");
      setRedirected(true);
    }
  }, [user, loading, navigate, redirected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      alert("Login successful");
    } catch (error) {
      setError("Invalid email or password");
      alert(error.message);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="auth-container">
      <h2>Sign In</h2>

      {error && <p className="auth-error">{error}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign In</button>
      </form>

      <p className="auth-footer">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>

      <p className="auth-footer">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>

      <p className="guest-option">or</p>

      <button
        className="guest-btn"
        onClick={() => navigate("/menu")}
      >
        Continue as Guest
      </button>

      <button
        className="back-home-btn"
        onClick={() => navigate("/")}
      >
        Go Back Home
      </button>
    </div>
  );
}

export default SignIn;
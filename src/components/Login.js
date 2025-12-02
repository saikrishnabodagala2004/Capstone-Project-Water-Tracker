import React, { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

const glassStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already signed in, redirect to home
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/");
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // Persist session so user stays signed in
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("auth/user-not-found")) setError("No account found with this email.");
      else if (code.includes("auth/wrong-password")) setError("Incorrect password.");
      else if (code.includes("auth/invalid-email")) setError("Invalid email address.");
      else setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto", padding: "30px", textAlign: "center", ...glassStyle }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "6px 0", borderRadius: "5px" }}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "6px 0", borderRadius: "5px" }}
          autoComplete="current-password"
        />

        <button
          type="submit"
          style={{ padding: "10px 20px", marginTop: "6px", borderRadius: "5px", background: "#27ae60", color: "#fff", border: "none", cursor: "pointer" }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <p style={{ marginTop: 12 }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;

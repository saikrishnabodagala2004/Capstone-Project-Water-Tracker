import React, { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  updateProfile
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

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // Persist session
      await setPersistence(auth, browserLocalPersistence);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Optionally update display name if provided
      if (displayName) {
        try {
          await updateProfile(userCred.user, { displayName });
        } catch (uErr) {
          console.warn("Profile update failed:", uErr);
        }
      }

      // Directly navigate to home after signup
      navigate("/");
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("auth/email-already-in-use")) setError("Email already in use.");
      else if (code.includes("auth/invalid-email")) setError("Invalid email address.");
      else if (code.includes("auth/weak-password")) setError("Weak password. Use at least 6 characters.");
      else setError("Signup failed. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto", padding: "30px", textAlign: "center", ...glassStyle }}>
      <h2 style={{ marginTop: 0 }}>Sign Up</h2>

      <form onSubmit={handleSignup} style={{ display: "grid", gap: 10 }}>
        <input
          type="text"
          placeholder="Full name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "6px 0", borderRadius: "5px" }}
          autoComplete="name"
        />
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
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", margin: "6px 0", borderRadius: "5px" }}
          autoComplete="new-password"
        />

        <button
          type="submit"
          style={{ padding: "10px 20px", marginTop: "6px", borderRadius: "5px", background: "#2980b9", color: "#fff", border: "none", cursor: "pointer" }}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Signup"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Signup;

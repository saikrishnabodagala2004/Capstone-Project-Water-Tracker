import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import ItemDetail from "./components/ItemDetail"; // ✅ changed
import AddItem from "./components/AddItem";       // ✅ changed

const glassStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
};

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "url('https://www.transparenttextures.com/patterns/water.png'), linear-gradient(135deg, #dff9fb, #74b9ff)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      <Router>
        {/* ✅ Glass Navbar */}
        <div
          style={{
            ...glassStyle,
            padding: "15px 30px",
            margin: "0 auto 20px",
            maxWidth: "1100px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, color: "#2c3e50" }}>💧 Water Tracker</h2>
          <nav>
            <Link to="/" style={{ margin: "0 10px", color: "#2c3e50", textDecoration: "none" }}>Home</Link>
            <Link to="/add-item" style={{ margin: "0 10px", color: "#2c3e50", textDecoration: "none" }}>Add Item</Link>
            <Link to="/login" style={{ margin: "0 10px", color: "#2c3e50", textDecoration: "none" }}>Login</Link>
            <Link to="/signup" style={{ margin: "0 10px", color: "#2c3e50", textDecoration: "none" }}>Signup</Link>
          </nav>
        </div>

        {/* ✅ Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/item/:id" element={<ItemDetail />} />  {/* ✅ changed */}
          <Route path="/add-item" element={<AddItem />} />     {/* ✅ changed */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;

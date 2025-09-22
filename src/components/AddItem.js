import React, { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function AddItem() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [waterFootprint, setWaterFootprint] = useState("");
  const [unit, setUnit] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !waterFootprint || !unit) {
      setMessage("Please fill all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "items"), {   // 🔹 changed "products" → "items"
        name,
        category,
        waterFootprint: Number(waterFootprint),
        unit
      });
      setMessage("Item added successfully!");
      setName("");
      setCategory("");
      setWaterFootprint("");
      setUnit("");
    } catch (error) {
      console.error("Error adding item:", error);
      setMessage("Error adding item. Check console.");
    }
  };

  return (
    <div style={{
      padding: "20px",
      fontFamily: "sans-serif",
      maxWidth: "400px",
      margin: "auto",
      textAlign: "center"
    }}>
      <h2>Add New Item</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        /><br />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        /><br />
        <input
          type="number"
          placeholder="Water Footprint"
          value={waterFootprint}
          onChange={(e) => setWaterFootprint(e.target.value)}
          style={inputStyle}
        /><br />
        <input
          type="text"
          placeholder="Unit (L/kg, L/item)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={inputStyle}
        /><br />
        <button type="submit" style={buttonStyle}>Add Item</button>
      </form>
      {message && <p style={{ marginTop: "10px", color: "green" }}>{message}</p>}
      <button
        onClick={() => navigate("/")}
        style={{ ...buttonStyle, backgroundColor: "#3498db", marginTop: "10px" }}
      >
        Go Home
      </button>
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  margin: "10px 0",
  width: "90%",
  maxWidth: "300px",
  borderRadius: "5px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  padding: "10px 20px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

export default AddItem;   // 🔹 renamed

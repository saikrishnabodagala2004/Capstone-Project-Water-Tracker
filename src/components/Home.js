import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

const glassStyle = {
  background: "rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
};

function Home() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [dateTime, setDateTime] = useState(new Date());
  const [tip, setTip] = useState("");
  const [quote, setQuote] = useState("");

  const tips = [
    "💡 A cotton shirt needs 2700 L of water to make.",
    "💡 Beef has one of the highest water footprints per kg.",
    "💡 Turning off the tap while brushing saves 6 liters per minute.",
    "💡 Reusing water bottles reduces hidden water footprints.",
    "💡 Rice requires around 2500 L of water per kg."
  ];

  const quotes = [
    "🌍 Every drop counts. Save water, save life.",
    "🌱 Sustainability starts with small daily choices.",
    "💧 Conserve today, secure tomorrow.",
    "🌿 Be the change you want to see in the world.",
    "♻️ The future depends on what we do in the present."
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsCol = collection(db, "items");
        const itemSnapshot = await getDocs(itemsCol);
        const itemList = itemSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemList);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();

    const interval = setInterval(() => setDateTime(new Date()), 1000);

    setTip(tips[Math.floor(Math.random() * tips.length)]);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    return () => clearInterval(interval);
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (item) => {
    if (selectedItems.some((i) => i.id === item.id)) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const clearAll = () => setSelectedItems([]);

  const totalFootprint = selectedItems.reduce(
    (sum, item) => sum + (item.waterFootprint || 0),
    0
  );

  const dailyLimit = 5000;
  const progress = Math.min((totalFootprint / dailyLimit) * 100, 100);

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ color: "#2c3e50" }}>💧 Water Footprint Tracker</h2>
        <p style={{ color: "#34495e", fontWeight: "bold" }}>
          {dateTime.toLocaleDateString()} | {dateTime.toLocaleTimeString()}
        </p>
      </div>

      {/* Daily Tip */}
      <div style={{ padding: "10px", marginBottom: "15px", fontStyle: "italic", color: "#2c3e50", ...glassStyle }}>
        {tip}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* Items */}
        <div style={{ flex: 2, marginRight: "20px" }}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px",
              margin: "20px 0",
              width: "80%",
              maxWidth: "300px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />

          {filteredItems.length === 0 ? (
            <p style={{ color: "#e74c3c" }}>No items found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: "0" }}>
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    ...glassStyle,
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedItems.some((i) => i.id === item.id)}
                      onChange={() => toggleSelect(item)}
                      style={{ marginRight: "10px" }}
                    />
                    <Link to={`/item/${item.id}`} style={{ textDecoration: "none", color: "#2c3e50" }}>
                      <strong>{item.name}</strong> - {item.waterFootprint} {item.unit} [{item.category}]
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Used Items */}
        <div style={{ flex: 1, padding: "15px", height: "fit-content", ...glassStyle }}>
          <h3 style={{ color: "#2c3e50" }}>📋 Used Items Today</h3>
          {selectedItems.length === 0 ? (
            <p style={{ color: "#7f8c8d" }}>No items selected yet.</p>
          ) : (
            <>
              <ul style={{ listStyle: "none", padding: "0" }}>
                {selectedItems.map((item) => (
                  <li key={item.id} style={{ marginBottom: "8px" }}>
                    ✅ {item.name} – {item.waterFootprint} {item.unit}
                  </li>
                ))}
              </ul>
              <button
                onClick={clearAll}
                style={{
                  marginTop: "10px",
                  padding: "8px 15px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
            </>
          )}
          <hr style={{ margin: "10px 0" }} />
          <p style={{ fontWeight: "bold", fontSize: "16px", color: "#27ae60" }}>Total: {totalFootprint} L</p>
          <div style={{ background: "#ddd", borderRadius: "5px", overflow: "hidden", height: "20px" }}>
            <div
              style={{
                width: `${progress}%`,
                background: progress < 70 ? "#27ae60" : "#e67e22",
                height: "100%",
                transition: "width 0.3s ease",
              }}
            ></div>
          </div>
          <small style={{ color: "#34495e" }}>Daily Limit: {dailyLimit} L</small>
        </div>
      </div>

      {/* Quote */}
      <div style={{ marginTop: "30px", textAlign: "center", padding: "15px", fontStyle: "italic", color: "#2c3e50", ...glassStyle }}>
        {quote}
      </div>
    </div>
  );
}

export default Home;

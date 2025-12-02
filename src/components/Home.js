import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import QRCode from "qrcode";

// ✅ Auth
import { auth } from "../firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";

const glassStyle = {
  background: "rgba(255, 255, 255, 0.18)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
};

const TODAY_KEY = "wf_selected_items_v1";
const todayStr = () => new Date().toISOString().slice(0, 10);

function unitLabel(unit) {
  if (!unit) return "count";
  if (unit.includes("/kg")) return "kg";
  if (unit.includes("/liter")) return "L";
  return "count";
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]); // [{...item, qty}]
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateTime, setDateTime] = useState(new Date());
  const [tip, setTip] = useState("");
  const [quote, setQuote] = useState("");

  // 👤 Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  const tips = [
    "💡 A cotton shirt needs ~2700 L of water to make.",
    "💡 Beef has one of the highest water footprints per kg.",
    "💡 Turning off the tap while brushing saves ~6 L/min.",
    "💡 Reusing bottles reduces hidden water footprints.",
    "💡 Rice needs ~2500 L of water per kg."
  ];
  const quotes = [
    "🌍 Every drop counts. Save water, save life.",
    "🌱 Sustainability starts with small daily choices.",
    "💧 Conserve today, secure tomorrow.",
    "🌿 Be the change you want to see.",
    "♻️ The future depends on what we do today."
  ];

  // 🔐 Auth bootstrap + subscription
  useEffect(() => {
    // Set immediate value so header doesn't flash Login/Signup incorrectly
    setUser(auth.currentUser || null);
    // Now subscribe to future changes
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // load data + restore today's selection
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsCol = collection(db, "items");
        const snap = await getDocs(itemsCol);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setItems(list);
      } catch (e) { console.error("Error fetching items:", e); }
    };
    fetchItems();

    const t = setInterval(() => setDateTime(new Date()), 1000);
    setTip(tips[Math.floor(Math.random() * tips.length)]);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    try {
      const raw = localStorage.getItem(TODAY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.date === todayStr() && Array.isArray(parsed.items)) {
          setSelectedItems(parsed.items);
        } else {
          localStorage.removeItem(TODAY_KEY);
        }
      }
    } catch {}

    return () => clearInterval(t);
  }, []);

  const persist = (next) => {
    setSelectedItems(next);
    try {
      localStorage.setItem(TODAY_KEY, JSON.stringify({ date: todayStr(), items: next }));
    } catch {}
  };

  // derived
  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter(i => (selectedCategory === "All" ? true : i.category === selectedCategory))
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm, selectedCategory]);

  const totalFootprint = selectedItems.reduce(
    (sum, it) => sum + (it.waterFootprint || 0) * (it.qty || 0),
    0
  );

  const dailyLimit = 5000;
  const progress = Math.min((totalFootprint / dailyLimit) * 100, 100);

  const isSelected = (id) => selectedItems.some(i => i.id === id);

  // Prompt for quantity on first select
  const toggleSelect = (item) => {
    if (isSelected(item.id)) {
      const next = selectedItems.filter(i => i.id !== item.id);
      persist(next);
    } else {
      const u = unitLabel(item.unit);
      const input = window.prompt(`Enter quantity for ${item.name} (${u}):`, "1");
      if (input === null) return;
      const q = Number(input);
      if (!Number.isFinite(q) || q <= 0) {
        alert("Please enter a valid quantity greater than 0.");
        return;
      }
      const next = [...selectedItems, { ...item, qty: q }];
      persist(next);
    }
  };

  // quantity controls
  const changeQty = (id, delta) => {
    const next = selectedItems
      .map(i => (i.id === id ? { ...i, qty: Math.max(0, (i.qty || 0) + delta) } : i))
      .filter(i => i.qty > 0);
    persist(next);
  };
  const setQty = (id, value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    const next = selectedItems
      .map(i => (i.id === id ? { ...i, qty: Math.max(0, num) } : i))
      .filter(i => i.qty > 0);
    persist(next);
  };
  const clearAll = () => persist([]);

  // Signature block (vector) for PDF
  const drawSignatureBlock = (doc, x, y, name = "Sai Krishna", title = "Authorized Signatory") => {
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.5);
    doc.line(x, y, x + 55, y);

    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.text(name, x + 1, y - 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(title, x + 1, y + 6);

    const cx = x + 80, cy = y - 2;
    doc.setDrawColor(25, 94, 192);
    doc.setLineWidth(0.6);
    doc.circle(cx, cy, 9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(25, 94, 192);
    doc.setFontSize(9);
    doc.text("VERIFIED", cx, cy + 2, { align: "center" });
    doc.setTextColor(0, 0, 0);
  };

  // PDF with QR + signature
  const generatePDF = async () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const verificationId = "WFT-" + now.getFullYear() + "-" + Math.floor(Math.random() * 9999).toString().padStart(4, "0");

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Water Footprint Report", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Date: ${dateStr}   Time: ${timeStr}`, 14, 26);
    doc.text(`Verification ID: ${verificationId}`, 14, 33);

    let y = 45;
    doc.setFont("helvetica", "bold");
    doc.text("Items Used Today", 14, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    if (selectedItems.length === 0) {
      doc.text("No items logged today.", 14, y);
      y += 10;
    } else {
      doc.setFont("helvetica", "bold");
      doc.text("No.", 14, y);
      doc.text("Item", 24, y);
      doc.text("Qty", 110, y);
      doc.text("Factor", 130, y);
      doc.text("Subtotal (L)", 165, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 6;
      doc.setLineWidth(0.2);
      doc.line(14, y, 196, y);
      y += 6;

      selectedItems.forEach((item, idx) => {
        const qty = item.qty || 1;
        const factor = `${item.waterFootprint} ${item.unit}`;
        const subtotal = qty * (item.waterFootprint || 0);

        doc.text(String(idx + 1), 14, y);
        const itemText = `${item.name} [${item.category}]`;
        doc.text(itemText.length > 46 ? itemText.slice(0, 43) + "..." : itemText, 24, y);
        doc.text(String(qty), 110, y);
        doc.text(factor.length > 20 ? factor.slice(0, 17) + "..." : factor, 130, y);
        doc.text(subtotal.toLocaleString(), 165, y, { align: "right" });

        y += 7;
        if (y > 260) { doc.addPage(); y = 20; }
      });
    }

    y += 4;
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text(`Total Water Footprint: ${totalFootprint.toLocaleString()} L`, 14, y);
    y += 12;

    const qrPayload =
      `Water Footprint Tracker\nVerification ID: ${verificationId}\n` +
      `Date: ${dateStr} ${timeStr}\nTotal: ${totalFootprint} L`;
    const qrDataURL = await QRCode.toDataURL(qrPayload);
    doc.addImage(qrDataURL, "PNG", 150, y - 6, 40, 40);

    drawSignatureBlock(doc, 14, y + 20, "Sai Krishna", "Authorized Signatory");

    const footY = y + 48;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(
      "Digitally verified by Water Footprint Tracker. This report is generated to promote sustainable water usage.",
      14,
      footY,
      { maxWidth: 180 }
    );

    const filename = `Water_Footprint_Report_${dateStr.replace(/\//g, "-")}.pdf`;
    doc.save(filename);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
      alert("Logout failed. Try again.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ color: "#2c3e50", margin: 0 }}>💧 Water Footprint Tracker</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ color: "#34495e", fontWeight: 600, margin: 0 }}>
            {dateTime.toLocaleDateString()} | {dateTime.toLocaleTimeString()}
          </p>

          {/* 👤 Auth area */}
          {authLoading ? null : user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#2c3e50" }}>
                Hi, <b>{user.displayName || user.email}</b>
              </span>
              <button
                onClick={handleLogout}
                style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#e74c3c", color: "#fff", cursor: "pointer" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link to="/login" style={{ textDecoration: "none", color: "#2d98da", fontWeight: 600 }}>Login</Link>
              <Link to="/signup" style={{ textDecoration: "none", color: "#27ae60", fontWeight: 600 }}>Signup</Link>
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      <div style={{ padding: 10, marginBottom: 15, fontStyle: "italic", color: "#2c3e50", ...glassStyle }}>
        {tip}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px",
            width: "60%",
            maxWidth: 360,
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
                ...(selectedCategory === cat ? { background: "#2d98da", color: "#fff" } : { background: "rgba(255,255,255,0.6)" }),
                ...glassStyle,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Left: scrollable items */}
        <div style={{ flex: 2 }}>
          <div
            className="items-scroll"
            style={{
              maxHeight: "62vh",
              overflowY: "auto",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {filteredItems.length === 0 ? (
              <p style={{ color: "#e74c3c" }}>No items found.</p>
            ) : (
              filteredItems.map((item) => {
                const selected = selectedItems.find(i => i.id === item.id);
                const u = unitLabel(item.unit);
                const rowSubtotal = selected ? selected.qty * (item.waterFootprint || 0) : 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      ...glassStyle,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleSelect(item)}
                        title="Select and enter quantity"
                      />
                      <Link to={`/item/${item.id}`} style={{ textDecoration: "none", color: "#2c3e50" }}>
                        <strong>{item.name}</strong>{" "}
                        <span style={{ color: "#555" }}>
                          – {item.waterFootprint} {item.unit} [{item.category}]
                        </span>
                      </Link>
                    </div>

                    {/* Quantity controls (visible once selected) */}
                    {selected && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "#555" }}>Qty ({u})</span>
                        <button onClick={() => changeQty(item.id, -1)} style={btnMini}>−</button>
                        <input
                          value={selected.qty}
                          onChange={(e) => setQty(item.id, e.target.value)}
                          type="number"
                          min="0"
                          step="1"
                          style={{
                            width: 70,
                            padding: "6px 8px",
                            borderRadius: 8,
                            border: "1px solid rgba(0,0,0,0.12)",
                            textAlign: "center",
                          }}
                        />
                        <button onClick={() => changeQty(item.id, +1)} style={btnMini}>+</button>
                        <span style={{ fontWeight: 600 }}>
                          {rowSubtotal.toLocaleString()} L
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: today's selection (sticky) */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              ...glassStyle,
              padding: 15,
              position: "sticky",
              top: 90,
            }}
          >
            <h3 style={{ color: "#2c3e50", marginTop: 0 }}>📋 Used Items Today</h3>

            {selectedItems.length === 0 ? (
              <p style={{ color: "#7f8c8d" }}>No items selected yet.</p>
            ) : (
              <>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {selectedItems.map((it) => (
                    <li key={it.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        ✅ {it.name} — {it.qty} × {it.waterFootprint} {it.unit}
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {(it.qty * it.waterFootprint).toLocaleString()} L
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={clearAll}
                  style={{
                    marginTop: 10,
                    padding: "8px 15px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Clear All
                </button>
              </>
            )}

            <hr style={{ margin: "12px 0" }} />
            <p style={{ fontWeight: 700, fontSize: 16, color: "#27ae60", margin: 0 }}>
              Total: {totalFootprint.toLocaleString()} L
            </p>

            <div style={{ background: "#eee", borderRadius: 6, overflow: "hidden", height: 12, marginTop: 10 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: progress < 70 ? "#27ae60" : "#e67e22",
                  transition: "width 0.25s",
                }}
              />
            </div>
            <small style={{ color: "#34495e" }}>Daily Limit: {dailyLimit} L</small>

            {/* Download PDF */}
            <button
              onClick={generatePDF}
              style={{
                marginTop: 15,
                padding: "10px 18px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              📥 Download Report (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div style={{ marginTop: 28, textAlign: "center", padding: 14, fontStyle: "italic", color: "#2c3e50", ...glassStyle }}>
        {quote}
      </div>
    </div>
  );
}

const btnMini = {
  width: 34, height: 34, borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.12)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.8)",
};

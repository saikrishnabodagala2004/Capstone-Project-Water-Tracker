import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id);   // 🔹 changed "products" → "items"
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setItem(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      }
    };

    fetchItem();
  }, [id]);

  return (
    <div style={{
      padding: "20px",
      fontFamily: "sans-serif",
      maxWidth: "600px",
      margin: "auto",
      textAlign: "center"
    }}>
      {item ? (
        <>
          <h2 style={{ color: "#2c3e50" }}>{item.name}</h2>
          <p><strong>Category:</strong> {item.category}</p>
          <p><strong>Water Footprint:</strong> {item.waterFootprint} {item.unit}</p>
          <p style={{ marginTop: "20px", color: "#34495e" }}>
            Did you know? Conserving water helps the environment and reduces your footprint.
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Go Back
          </button>
        </>
      ) : (
        <p>Loading item details...</p> 
      )}
    </div>
  );
}

export default ItemDetail;   // 🔹 renamed

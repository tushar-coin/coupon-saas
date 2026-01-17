import React from "react";
import { createRoot } from "react-dom/client";

/**
 * Find or create mount point
 */
function getMountNode() {
  let el = document.getElementById("my-widget");
  if (!el) {
    el = document.createElement("div");
    el.id = "my-widget";
    document.body.appendChild(el);
  }
  return el;
}

function Widget() {
  const scripts = document.getElementsByTagName("script");
  const current = Array.from(scripts).find((s) =>
    s.src.includes("widget.js")
  );

  const config = {
    theme: current?.getAttribute("data-theme") || "light",
  };

  const [offers, setOffers] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [currentOrg, setCurrentOrg] = React.useState("");

  React.useEffect(() => {
    function applyCoupons() {
      console.log("[WIDGET] APPLY_COUPONS received");

      if (!window.__CART_DATA__) {
        console.error("[WIDGET] window.__CART_DATA__ missing");
        setError("Cart data is missing");
        return;
      }

      const orgName = window.__ORG_NAME__ || "";
      if (!orgName) {
        setError("Organization name is required");
        return;
      }

      setCurrentOrg(orgName);
      setLoading(true);
      setError(null);
      setOffers(null);

      // Prepare request payload
      const payload = {
        cart: window.__CART_DATA__.cart,
        merchant_id: orgName
      };

      console.log("[WIDGET] Calling backend with:", payload);

      fetch("http://localhost:8081/api/v1/public/apply-coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("[WIDGET] Response:", data);
          setOffers(data);
        })
        .catch((err) => {
          console.error("[WIDGET] Error:", err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }

    window.addEventListener("APPLY_COUPONS", applyCoupons);
    return () =>
      window.removeEventListener("APPLY_COUPONS", applyCoupons);
  }, []);

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #444",
        borderRadius: 8,
        background: config.theme === "dark" ? "#1a1a2e" : "#fff",
        color: config.theme === "dark" ? "#eee" : "#000",
        marginTop: 16,
        fontFamily: "sans-serif",
      }}
    >
      <h3 style={{ color: "#00d4ff", margin: "0 0 12px 0" }}>🎟️ Available Coupons</h3>
      
      {currentOrg && (
        <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px 0" }}>
          Organization: <strong style={{ color: "#00d4ff" }}>{currentOrg}</strong>
        </p>
      )}

      {loading && <p style={{ color: "#ffa500" }}>⏳ Fetching coupons…</p>}

      {error && (
        <p style={{ color: "#ff4444" }}>❌ Error: {error}</p>
      )}

      {!loading && !error && offers && (
        <pre style={{
          background: "#0f0f1a",
          padding: 12,
          borderRadius: 6,
          overflow: "auto",
          fontSize: 12,
          maxHeight: 400,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {JSON.stringify(offers, null, 2)}
        </pre>
      )}

      {!loading && !error && !offers && (
        <p style={{ color: "#888" }}>Enter an org name and click "Apply Coupons" to see the response.</p>
      )}
    </div>
  );
}

const mountNode = getMountNode();
createRoot(mountNode).render(<Widget />);
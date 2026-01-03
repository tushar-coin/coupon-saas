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
    merchantId: current?.getAttribute("data-merchant-id") || "dev",
    theme: current?.getAttribute("data-theme") || "light",
  };

  const [offers, setOffers] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    function applyCoupons() {
      console.log("[WIDGET] APPLY_COUPONS received");

      if (!window.__CART_DATA__) {
        console.error("[WIDGET] window.__CART_DATA__ missing");
        return;
      }

      setLoading(true);

      // simulate backend result for now
      fetch("http://localhost:8081/compute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(window.__CART_DATA__),
      })
        .then((res) => res.json())
        .then((data) => {
          setOffers(data);
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
        border: "1px solid #ccc",
        background: config.theme === "dark" ? "#111" : "#fff",
        color: config.theme === "dark" ? "#fff" : "#000",
        marginTop: 16,
        fontFamily: "sans-serif",
      }}
    >
      <h3>Widget</h3>
      <p>Merchant: {config.merchantId}</p>
      <p>Theme: {config.theme}</p>

      {loading && <p>Applying coupons…</p>}

      {!loading && offers && (
        <pre>{JSON.stringify(offers, null, 2)}</pre>
      )}

      {!loading && !offers && <p>No offers applied yet.</p>}
    </div>
  );
}

const mountNode = getMountNode();
createRoot(mountNode).render(<Widget />);
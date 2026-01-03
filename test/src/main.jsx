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

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #ccc",
        background: config.theme === "dark" ? "#111" : "#fff",
        color: config.theme === "dark" ? "#fff" : "#000",
      }}
    >
      <h3>Widget</h3>
      <p>Merchant: {config.merchantId || "dev"}</p>
      <p>Theme: {config.theme}</p>
    </div>
  );
}

const mountNode = getMountNode();
createRoot(mountNode).render(<Widget />);
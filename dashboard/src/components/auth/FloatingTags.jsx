import { useMemo } from "react";
import "../../styles/FloatingTags.css";

// Discount tag data
const DISCOUNTS = [
  { text: "-20%", type: "percent" },
  { text: "-50%", type: "percent" },
  { text: "-15%", type: "percent" },
  { text: "-30%", type: "percent" },
  { text: "$10 OFF", type: "dollar" },
  { text: "$25 OFF", type: "dollar" },
  { text: "$5 OFF", type: "dollar" },
  { text: "SAVE 30%", type: "save" },
  { text: "SAVE 40%", type: "save" },
  { text: "DEAL", type: "deal" },
  { text: "-25%", type: "percent" },
  { text: "$15 OFF", type: "dollar" },
  { text: "SAVE 20%", type: "save" },
  { text: "-10%", type: "percent" },
  { text: "HOT", type: "deal" },
  { text: "$50 OFF", type: "dollar" },
];

// Generate random properties for each tag
const generateTags = () => {
  return DISCOUNTS.map((discount, index) => ({
    ...discount,
    id: index,
    left: `${5 + Math.random() * 90}%`, // 5-95% from left
    duration: `${15 + Math.random() * 20}s`, // 15-35s duration
    delay: `${Math.random() * 10}s`, // 0-10s delay
    rotation: `${-15 + Math.random() * 30}deg`, // -15 to +15 degrees
    opacity: 0.15 + Math.random() * 0.15, // 0.15-0.30 opacity
    // New: Sway properties for leaf-fall effect
    sway: `${30 + Math.random() * 30}px`, // 30-60px horizontal sway
    swayDir: Math.random() > 0.5 ? 1 : -1, // Start direction (left or right)
    wobble: `${8 + Math.random() * 10}deg`, // 8-18deg rotation wobble
  }));
};

const FloatingTags = () => {
  // Generate tags once on mount
  const tags = useMemo(() => generateTags(), []);

  return (
    <div className="floating-tags-container">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className={`floating-tag ${tag.type}`}
          style={{
            left: tag.left,
            "--duration": tag.duration,
            "--delay": tag.delay,
            "--rotation": tag.rotation,
            "--opacity": tag.opacity,
            "--sway": tag.sway,
            "--sway-dir": tag.swayDir,
            "--wobble": tag.wobble,
          }}
        >
          {tag.text}
        </div>
      ))}
    </div>
  );
};

export default FloatingTags;

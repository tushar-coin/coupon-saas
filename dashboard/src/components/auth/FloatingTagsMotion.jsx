import { motion } from "framer-motion";
import { useMemo } from "react";
import "../../styles/FloatingTags.css";

// Discount tag data - expanded for more visual impact
const DISCOUNTS = [
  // Left side tags
  { text: "-20%", type: "percent", side: "left" },
  { text: "-50%", type: "percent", side: "left" },
  { text: "$10 OFF", type: "dollar", side: "left" },
  { text: "SAVE 30%", type: "save", side: "left" },
  { text: "DEAL", type: "deal", side: "left" },
  { text: "-25%", type: "percent", side: "left" },
  { text: "$15 OFF", type: "dollar", side: "left" },
  { text: "SAVE 20%", type: "save", side: "left" },
  { text: "-35%", type: "percent", side: "left" },
  { text: "HOT", type: "deal", side: "left" },
  // Right side tags
  { text: "-15%", type: "percent", side: "right" },
  { text: "-30%", type: "percent", side: "right" },
  { text: "$25 OFF", type: "dollar", side: "right" },
  { text: "$5 OFF", type: "dollar", side: "right" },
  { text: "SAVE 40%", type: "save", side: "right" },
  { text: "-10%", type: "percent", side: "right" },
  { text: "$50 OFF", type: "dollar", side: "right" },
  { text: "SAVE 15%", type: "save", side: "right" },
  { text: "-45%", type: "percent", side: "right" },
  { text: "NEW", type: "deal", side: "right" },
  // Edge/corner tags - partially off-screen
  { text: "-60%", type: "percent", side: "edge-left" },
  { text: "MEGA", type: "deal", side: "edge-left" },
  { text: "$100 OFF", type: "dollar", side: "edge-left" },
  { text: "SAVE 50%", type: "save", side: "edge-left" },
  { text: "-75%", type: "percent", side: "edge-right" },
  { text: "WOW", type: "deal", side: "edge-right" },
  { text: "$75 OFF", type: "dollar", side: "edge-right" },
  { text: "SAVE 60%", type: "save", side: "edge-right" },
];

// Generate sway path for physics-based animation
const generateSwayPath = (amplitude, direction, wobble, rotation, startOffset) => {
  return {
    x: [
      startOffset,
      startOffset + amplitude * direction,
      startOffset + amplitude * direction * -0.75,
      startOffset + amplitude * direction * 0.5,
      startOffset + amplitude * direction * -0.25,
      startOffset,
    ],
    rotate: [
      rotation,
      rotation + wobble,
      rotation - wobble * 0.9,
      rotation + wobble * 0.6,
      rotation - wobble * 0.3,
      rotation,
    ],
  };
};

// Generate random properties for each tag
const generateTags = () => {
  return DISCOUNTS.map((discount, index) => {
    const rotation = -15 + Math.random() * 30;
    const amplitude = 30 + Math.random() * 30;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const wobble = 8 + Math.random() * 10;
    const startOffset = -50 + Math.random() * 100;
    
    // Position based on side
    let left;
    if (discount.side === "left") {
      left = `${5 + Math.random() * 23}%`;
    } else if (discount.side === "right") {
      left = `${72 + Math.random() * 23}%`;
    } else if (discount.side === "edge-left") {
      // Partially off-screen on left (-8% to -2%)
      left = `${-8 + Math.random() * 6}%`;
    } else if (discount.side === "edge-right") {
      // Partially off-screen on right (96% to 102%)
      left = `${96 + Math.random() * 6}%`;
    }
    
    return {
      ...discount,
      id: index,
      left,
      duration: 15 + Math.random() * 15,
      delay: Math.random() * 12,
      opacity: 0.35 + Math.random() * 0.15,
      startOffset,
      swayPath: generateSwayPath(amplitude, direction, wobble, rotation, startOffset),
    };
  });
};

// Individual floating tag with Framer Motion
const FloatingTag = ({ tag }) => {
  return (
    <motion.div
      className={`floating-tag-motion ${tag.type}`}
      style={{ left: tag.left }}
      initial={{ 
        y: "-10vh", 
        x: 0, 
        rotate: tag.swayPath.rotate[0], 
        opacity: 0 
      }}
      animate={{
        y: ["-10vh", "20vh", "40vh", "60vh", "80vh", "110vh"],
        x: tag.swayPath.x,
        rotate: tag.swayPath.rotate,
        opacity: [0, tag.opacity, tag.opacity, tag.opacity, tag.opacity, 0],
      }}
      transition={{
        duration: tag.duration,
        repeat: Infinity,
        delay: tag.delay,
        ease: "linear",
        times: [0, 0.15, 0.35, 0.55, 0.75, 1],
        x: {
          duration: tag.duration,
          ease: "easeInOut",
        },
        rotate: {
          duration: tag.duration,
          ease: "easeInOut",
        },
      }}
    >
      {tag.text}
    </motion.div>
  );
};

const FloatingTagsMotion = () => {
  const tags = useMemo(() => generateTags(), []);

  return (
    <div className="floating-tags-container">
      {tags.map((tag) => (
        <FloatingTag key={tag.id} tag={tag} />
      ))}
    </div>
  );
};

export default FloatingTagsMotion;

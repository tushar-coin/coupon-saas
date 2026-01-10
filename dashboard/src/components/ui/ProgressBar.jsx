import { motion } from "framer-motion";
import "./ProgressBar.css";

export default function ProgressBar({ progress, steps = 3 }) {
  const percentage = (progress / steps) * 100;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-track">
        <motion.div 
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="progress-percentage">{Math.round(percentage)}%</span>
    </div>
  );
}

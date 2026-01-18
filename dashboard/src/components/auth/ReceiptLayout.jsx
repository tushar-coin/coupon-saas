import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import FloatingTagsMotion from "./FloatingTagsMotion";
import "../../styles/Receipt.css";

// Generate random transaction ID
const generateTxnId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TXN-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate barcode pattern
const generateBarcode = () => {
  const pattern = [];
  for (let i = 0; i < 30; i++) {
    const type = Math.random() > 0.7 ? "thick" : Math.random() > 0.5 ? "thin" : "";
    pattern.push(type);
  }
  return pattern;
};

// Get current timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const ReceiptLayout = ({ children, onTearOff, isTearingOff = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const txnId = useMemo(() => generateTxnId(), []);
  const barcode = useMemo(() => generateBarcode(), []);
  const timestamp = useMemo(() => getTimestamp(), []);

  useEffect(() => {
    // Delay to trigger print animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Print-in animation variants
  const printVariants = {
    hidden: {
      y: "-100%",
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15,
        duration: 1.2
      }
    },
    tearOff: {
      y: "100vh",
      rotate: -5,
      opacity: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  return (
    <div className="receipt-container">
      {/* Floating discount tags background - Framer Motion version */}
      <FloatingTagsMotion />
      
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            className="receipt-paper"
            variants={printVariants}
            initial="hidden"
            animate={isTearingOff ? "tearOff" : "visible"}
            exit="tearOff"
            onAnimationComplete={(definition) => {
              if (definition === "tearOff" && onTearOff) {
                onTearOff();
              }
            }}
          >
            {/* Zigzag top edge */}
            <div className="receipt-edge-top" />

            <div className="receipt-content">
              {/* Header */}
              <div className="receipt-header">
                <div className="receipt-logo">
                  COUPON<span className="receipt-logo-accent">FLOW</span>
                </div>
                <div className="receipt-tagline">Discount Management System</div>
                <div className="receipt-txn">{txnId}</div>
              </div>

              <hr className="receipt-divider" />

              {/* Form content passed as children */}
              {children}

              <hr className="receipt-divider" />

              {/* Footer with barcode */}
              <div className="receipt-footer">
                <div className="receipt-barcode">
                  {barcode.map((type, index) => (
                    <div key={index} className={`receipt-barcode-line ${type}`} />
                  ))}
                </div>
                <div className="receipt-timestamp">{timestamp}</div>
              </div>
            </div>

            {/* Zigzag bottom edge */}
            <div className="receipt-edge-bottom" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceiptLayout;

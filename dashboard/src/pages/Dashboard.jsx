import { useState, useMemo, useEffect } from "react";
import { TrendingUp, Tag, Clock, ChevronDown, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, isBefore, isAfter, parseISO } from "date-fns";
import useCouponStore from "../store/useCouponStore";
import CountUp from "../components/ui/CountUp";
import Sparkline from "../components/ui/Sparkline";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";
import { CURRENCY } from "../config/currency";
import "../styles/Dashboard.css";

// Enhanced Stats Card Component with animations and sparkline
const StatsCard = ({ title, value, icon: Icon, color, isActive, onClick, trendData }) => (
  <motion.div 
    className={`stat-card ${isActive ? 'active-card' : ''}`}
    onClick={onClick}
    whileHover={{ 
      y: -8, 
      scale: 1.02,
      transition: { type: "spring", stiffness: 300 }
    }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="stat-header">
      <div className={`stat-icon-wrapper ${color}`}>
        <Icon size={24} />
      </div>
      {isActive && <div className="active-indicator">Viewing</div>}
    </div>
    <div className="stat-content">
      <h3 className="stat-value">
        <CountUp end={typeof value === 'number' ? value : parseInt(value) || 0} duration={1500} />
      </h3>
      <p className="stat-title">{title}</p>
    </div>
    {trendData && (
      <div className="stat-sparkline">
        <Sparkline data={trendData} color={color === 'blue' ? '#2563EB' : color === 'green' ? '#059669' : '#EA580C'} />
      </div>
    )}
  </motion.div>
);

export default function Dashboard() {
  const { coupons, initialize } = useCouponStore();
  
  // Initialize data on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const [activeView, setActiveView] = useState("redemptions"); // 'redemptions' | 'active' | 'expiring'
  const [expiryRange, setExpiryRange] = useState("30"); // '7' | '30' | '90'

  // --- DERIVED DATA ---
  
  // 1. Total Redemptions
  const totalRedemptions = useMemo(() => coupons.reduce((acc, curr) => acc + (parseInt(curr.redemptions) || 0), 0), [coupons]);

  // 2. Active Coupons Count
  const activeCouponsCount = useMemo(() => coupons.filter(c => c.status === "Active").length, [coupons]);

  // 3. Expiring Soon Count (Dynamic based on logic, but card shows total 'at risk' generally, let's say 30 days default for the card stat)
  const expiringSoonCount = useMemo(() => {
    const today = new Date();
    const threshold = addDays(today, 30);
    return coupons.filter(c => {
      // Safety check for valid date
      if (!c.expiryDate) return false;
      const exp = parseISO(c.expiryDate);
      return c.status === "Active" && isAfter(exp, today) && isBefore(exp, threshold);
    }).length;
  }, [coupons]);

  // Mock 7-day trend data for sparklines
  const trendData = {
    redemptions: [
      { value: 120 }, { value: 145 }, { value: 132 }, 
      { value: 158 }, { value: 143 }, { value: 167 }, { value: totalRedemptions }
    ],
    active: [
      { value: 8 }, { value: 9 }, { value: 8 }, 
      { value: 10 }, { value: 9 }, { value: 10 }, { value: activeCouponsCount }
    ],
    expiring: [
      { value: 5 }, { value: 4 }, { value: 6 }, 
      { value: 5 }, { value: 4 }, { value: 5 }, { value: expiringSoonCount }
    ],
  };

  // --- FILTERED TABLE DATA ---
  const tableData = useMemo(() => {
    let data = [...coupons];

    if (activeView === "redemptions") {
      // Sort by highest redemptions
      return data.sort((a, b) => (b.redemptions || 0) - (a.redemptions || 0));
    } 
    
    if (activeView === "active") {
      // Show only active
      return data.filter(c => c.status === "Active");
    } 
    
    if (activeView === "expiring") {
      // Filter by expiry range
      const today = new Date();
      const threshold = addDays(today, parseInt(expiryRange));
      return data
        .filter(c => {
          if (!c.expiryDate) return false;
          const exp = parseISO(c.expiryDate);
          return c.status === "Active" && isAfter(exp, today) && isBefore(exp, threshold);
        })
        .sort((a, b) => parseISO(a.expiryDate) - parseISO(b.expiryDate)); // Sort nearest expiry first
    }

    return data;
  }, [activeView, expiryRange, coupons]);


  const getSectionTitle = () => {
    switch (activeView) {
      case "redemptions": return "Top Performing Coupons";
      case "active": return "Currently Active Offers";
      case "expiring": return "Expiring Soon (Action Needed)";
      default: return "Coupon Data";
    }
  };

  return (
    <div className="dashboard-container">
      {/* Interactive Stats Grid */}
      <div className="stats-grid three-col"> {/* CSS Grid needs update for 3 columns if we want them wider, or keep 4 and leave 1 empty? Plan said remove 2 add 1, so 3 cards total? */}
        <StatsCard 
          title="Total Redemptions" 
          value={totalRedemptions} 
          icon={Tag} 
          color="blue"
          isActive={activeView === "redemptions"}
          onClick={() => setActiveView("redemptions")}
          trendData={trendData.redemptions}
        />
        <StatsCard 
          title="Active Coupons" 
          value={activeCouponsCount} 
          icon={TrendingUp} 
          color="green"
          isActive={activeView === "active"}
          onClick={() => setActiveView("active")}
          trendData={trendData.active}
        />
        <StatsCard 
          title="Expiring Soon (<30 Days)" 
          value={expiringSoonCount} 
          icon={Clock} 
          color="orange"
          isActive={activeView === "expiring"}
          onClick={() => setActiveView("expiring")}
          trendData={trendData.expiring}
        />
      </div>

      {/* Dynamic Data Section */}
      <div className="dashboard-section mt-8">
        <div className="section-header">
          <h3 className="section-title">{getSectionTitle()}</h3>
          
          {/* Controls for Expiring View */}
          {activeView === "expiring" && (
              <div className="filter-controls">
                <div style={{ width: '180px' }}>
                  <Select 
                    options={[
                      { value: "7", label: "Next 7 Days" },
                      { value: "30", label: "Next 30 Days" },
                      { value: "90", label: "Next 3 Months" }
                    ]}
                    value={expiryRange}
                    onChange={(val) => setExpiryRange(val)}
                    icon={Filter}
                  />
                </div>
              </div>
          )}
        </div>

        <div className={`card activity-table-wrapper ${activeView}-view`}>
          <AnimatePresence mode="wait">
            <motion.table 
              className="activity-table"
              key={activeView}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Coupon Code</th>
                  <th>Type</th>
                  {activeView !== "expiring" && <th>Redemptions</th>}
                  {activeView === "expiring" && <th>Expiry Date</th>}
                  {activeView === "expiring" && <th>Days Left</th>}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length > 0 ? (
                  tableData.map((coupon, index) => {
                    const daysLeft = Math.ceil((parseISO(coupon.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft <= 3;

                    return (
                      <tr key={coupon.id}>
                        <td className="text-muted">#{index + 1}</td>
                        <td className="font-medium">
                          <span className="coupon-code">{coupon.code}</span>
                        </td>
                        <td>
                          {coupon.type === 'Percentage' ? `${coupon.value}%` : `${CURRENCY.symbol}${coupon.value}`}
                        </td>
                        
                        {activeView !== "expiring" && (
                          <td className="font-bold">{coupon.redemptions.toLocaleString()}</td>
                        )}

                        {activeView === "expiring" && (
                          <>
                            <td>{format(parseISO(coupon.expiryDate), "MMM d, yyyy HH:mm")}</td>
                            <td>
                              <Badge variant={isUrgent ? 'danger' : 'warning'}>
                                {daysLeft} Days
                              </Badge>
                            </td>
                          </>
                        )}
                        
                        <td>
                          <Badge status={coupon.status} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No coupons found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </motion.table>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

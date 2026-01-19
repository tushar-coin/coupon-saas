import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Filter, MoreHorizontal, Trash2, Edit, PauseCircle, PlayCircle, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import useCouponStore from "../store/useCouponStore";
import { TableRowSkeleton } from "../components/ui/Skeleton";
import CouponCardMobile from "../components/ui/CouponCardMobile";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import { CURRENCY } from "../config/currency";
import "../styles/Coupons.css";

export default function Coupons() {
  const { coupons, toggleStatus, deleteCoupon, initialize } = useCouponStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [skeletonRowCount, setSkeletonRowCount] = useState(10); // Default fallback
  
  // Calculate how many skeleton rows to show based on viewport height
  useEffect(() => {
    const calculateSkeletonRows = () => {
      const viewportHeight = window.innerHeight;
      const headerHeight = 140; // From calc(100vh - 140px)
      const tableHeaderHeight = 60; // Table header
      const rowHeight = 65; // Average row height (padding + content)
      
      const availableHeight = viewportHeight - headerHeight - tableHeaderHeight;
      const rowCount = Math.floor(availableHeight / rowHeight);
      
      // Ensure between 5 and 30 rows
      setSkeletonRowCount(Math.max(5, Math.min(rowCount, 30)));
    };
    
    calculateSkeletonRows();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateSkeletonRows);
    return () => window.removeEventListener('resize', calculateSkeletonRows);
  }, []);
  
  // Initialize data on mount (in case user lands here first)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await initialize();
      // Simulate network delay for skeleton demonstration
      setTimeout(() => setIsLoading(false), 800);
    };
    loadData();
  }, [initialize]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterVisibility, setFilterVisibility] = useState("All");
  const [activeActionId, setActiveActionId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Filter Logic
  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || coupon.status === filterStatus;
      const matchesVisibility = filterVisibility === "All" || (filterVisibility === "Public" ? coupon.visible : !coupon.visible);
      return matchesSearch && matchesStatus && matchesVisibility;
    });
  }, [coupons, searchTerm, filterStatus, filterVisibility]);

  // Actions
  const handleToggleStatus = (id) => {
    toggleStatus(id);
    setActiveActionId(null);
  };

  const confirmDelete = (id) => {
    deleteCoupon(id);
    setDeleteId(null);
    setActiveActionId(null);
  };

  // Handle action button click
  const handleActionClick = (e, id) => {
    e.stopPropagation();
    if (activeActionId === id) {
      setActiveActionId(null);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.right - 160 // Align right edge (160px is width)
    });
    setActiveActionId(id);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveActionId(null);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside, true); // Capture scroll too
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside, true);
    };
  }, []);

  return (
    <div className="coupons-container">
      {/* ... Toolbar ... */}
      <div className="toolbar">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search coupons..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="actions-wrapper">
          <Select 
            options={[
              { value: "All", label: "All Status" },
              { value: "Active", label: "Active" },
              { value: "Paused", label: "Paused" },
              { value: "Expired", label: "Expired" }
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            icon={Filter}
          />

          <Select 
            options={[
              { value: "All", label: "All Visibility" },
              { value: "Public", label: "Public" },
              { value: "Hidden", label: "Hidden" }
            ]}
            value={filterVisibility}
            onChange={setFilterVisibility}
            icon={Eye}
          />
          
          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={() => window.location.href = '/coupons/create'}
          >
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="card coupons-table-wrapper">
        <table className="coupons-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min. Spend</th>
              <th>Visibility</th>
              <th>Status</th>
              <th>Usage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton loading rows (dynamic based on viewport)
              Array.from({ length: skeletonRowCount }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))
            ) : (
              filteredCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <span className="coupon-code">{coupon.code}</span>
                    <div className="coupon-type">{coupon.type}</div>
                  </td>
                  <td className="font-medium">{coupon.value}{coupon.type === 'Percentage' ? '%' : CURRENCY.symbol}</td>
                  <td className="text-muted">{CURRENCY.symbol}{coupon.minOrder}</td>
                  <td>
                    <Badge status={coupon.visible ? "Public" : "Influencer"} />
                  </td>
                  <td>
                    <Badge status={coupon.status} />
                  </td>
                  <td>
                    {coupon.redemptions} <span className="text-muted">/ {coupon.usageLimit}</span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className={`icon-btn ${activeActionId === coupon.id ? 'active' : ''}`}
                      onClick={(e) => handleActionClick(e, coupon.id)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && filteredCoupons.length === 0 && (
                <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        No coupons found matching your search.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dropdown Menu (Fixed Position) */}
      {activeActionId && (
        <div 
          className="actions-dropdown glass"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <Link to={`/coupons/edit/${activeActionId}`} className="dropdown-item">
            <Edit size={14} /> Edit
          </Link>
          <button onClick={() => handleToggleStatus(activeActionId)} className="dropdown-item w-full">
             {/* Note: Find the coupon to check status */}
             {(() => {
                const c = coupons.find(c => c.id === activeActionId);
                return c?.status === "Active" ? 
                  <><PauseCircle size={14} /> Pause</> : 
                  <><PlayCircle size={14} /> Activate</>;
             })()}
          </button>
          <button className="dropdown-item w-full text-danger" onClick={() => setDeleteId(activeActionId)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Mobile Card Grid */}
      <div className="coupons-grid-mobile">
        {isLoading ? (
          <div style={{ padding: "1rem", color: "var(--text-muted)", textAlign: "center" }}>
            Loading coupons...
          </div>
        ) : filteredCoupons.length > 0 ? (
          filteredCoupons.map((coupon) => (
            <CouponCardMobile
              key={coupon.id}
              coupon={coupon}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeleteId}
            />
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No coupons found matching your search.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h3>Delete Coupon?</h3>
            <p>Are you sure you want to delete this coupon? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button 
                  className="btn-primary" 
                  style={{ background: 'var(--danger)' }}
                  onClick={() => confirmDelete(deleteId)}
              >
                  Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

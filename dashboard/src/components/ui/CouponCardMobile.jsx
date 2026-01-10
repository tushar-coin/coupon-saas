import { Link } from "react-router-dom";
import { Edit, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import Badge from "./Badge";
import "./CouponCardMobile.css";

export default function CouponCardMobile({ 
  coupon, 
  onToggleStatus, 
  onDelete 
}) {
  return (
    <div className="coupon-card-mobile">
      <div className="coupon-card-header">
        <div>
          <span className="coupon-code-mobile">{coupon.code}</span>
          <div className="coupon-type-mobile">{coupon.type}</div>
        </div>
        <Badge status={coupon.status} />
      </div>

      <div className="coupon-card-body">
        <div className="coupon-card-row">
          <span className="label">Discount</span>
          <span className="value">
            {coupon.value}{coupon.type === 'Percentage' ? '%' : '$'}
          </span>
        </div>
        <div className="coupon-card-row">
          <span className="label">Min. Spend</span>
          <span className="value">${coupon.minOrder}</span>
        </div>
        <div className="coupon-card-row">
          <span className="label">Visibility</span>
          <Badge status={coupon.visible ? "Public" : "Influencer"} />
        </div>
        <div className="coupon-card-row">
          <span className="label">Usage</span>
          <span className="value">
            {coupon.redemptions} / {coupon.usageLimit}
          </span>
        </div>
      </div>

      <div className="coupon-card-actions">
        <Link to={`/coupons/edit/${coupon.id}`} className="btn-icon-mobile">
          <Edit size={16} />
          Edit
        </Link>
        <button 
          className="btn-icon-mobile"
          onClick={() => onToggleStatus(coupon.id)}
        >
          {coupon.status === "Active" ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
          {coupon.status === "Active" ? "Pause" : "Activate"}
        </button>
        <button 
          className="btn-icon-mobile danger"
          onClick={() => onDelete(coupon.id)}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}

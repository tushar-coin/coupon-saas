package domain

import (
	"time"
)

type DiscountType string
type CouponLevel string

const (
	DiscountTypePercentage DiscountType = "percentage"
	DiscountTypeFixed      DiscountType = "fixed"
)

const (
	LevelCart CouponLevel = "cart_level"
	LevelTag  CouponLevel = "tag_level"
)

// Coupon represents the discount rule entity
type Coupon struct {
	ID          string       `json:"id"`
	OrgName     string       `json:"org_name"`
	Code        string       `json:"code"`
	Description string       `json:"description"`
	Type        DiscountType `json:"type"`
	Level       CouponLevel  `json:"level"`

	// Discount Details
	DiscountAmount float64 `json:"discount_amount"` // E.g., 10 for 10% or $10
	MinOrderAmount float64 `json:"min_order_amount"`
	MaxDiscount    float64 `json:"max_discount"` // To cap percentage based discounts

	// Constraints
	ApplicableTags []string `json:"applicable_tags"` // For tag-level coupons
	IsActive       bool     `json:"is_active"`
	Visible        bool     `json:"visible"`     // Publicly visible in widget
	UsageLimit     int      `json:"usage_limit"` // Global limit
	UsageCount     int      `json:"usage_count"` // Current usage

	ExpiryDate *time.Time `json:"expiry_date,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// Validation logic can go here (methods on Coupon)
func (c *Coupon) IsValid() bool {
	return c.IsActive && (c.UsageLimit == 0 || c.UsageCount < c.UsageLimit)
}

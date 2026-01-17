package domain

type CartItem struct {
	ItemID   string   `json:"item_id"`
	Name     string   `json:"name"`
	Price    float64  `json:"price"`
	Tags     []string `json:"tags"`
	Quantity int      `json:"quantity"`
}

type Cart struct {
	Items []CartItem `json:"items"`
}

type ReasonCode string

const (
	ReasonSuccess             ReasonCode = "SUCCESS"
	ReasonInvalidCode         ReasonCode = "INVALID_CODE"
	ReasonInactive            ReasonCode = "INACTIVE"
	ReasonUsageLimitExceeded  ReasonCode = "USAGE_LIMIT_EXCEEDED"
	ReasonExpired             ReasonCode = "EXPIRED"
	ReasonMinOrderNotMet      ReasonCode = "MIN_ORDER_NOT_MET"
	ReasonNotApplicableToCart ReasonCode = "NOT_APPLICABLE_TO_CART"
	ReasonUnknown             ReasonCode = "UNKNOWN"
)

type ComputeResult struct {
	CouponID       string     `json:"coupon_id"`
	CouponCode     string     `json:"coupon_code"`
	DiscountAmount float64    `json:"discount_amount"`
	Message        string     `json:"message"`
	ReasonCode     ReasonCode `json:"reason_code"`
	MissingAmount  float64    `json:"missing_amount,omitempty"` // How much more needed to satisfy MinOrder
	Success        bool       `json:"success"`
}

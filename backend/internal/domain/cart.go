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

type ComputeResult struct {
	CouponID       string  `json:"coupon_id"`
	DiscountAmount float64 `json:"discount_amount"`
	Message        string  `json:"message"`
	Success        bool    `json:"success"`
}

package service

import (
	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"
	"fmt"
	"math"
)

type ComputationService struct {
	repo ports.CouponRepository
}

func NewComputationService(repo ports.CouponRepository) *ComputationService {
	return &ComputationService{repo: repo}
}

// ComputeDiscount applies the business logic from test.go
func (s *ComputationService) ComputeDiscount(cart domain.Cart, couponCode string) (*domain.ComputeResult, error) {
	coupon, err := s.repo.FindByCode(couponCode)
	if err != nil {
		return &domain.ComputeResult{
			Success: false,
			Message: "Invalid coupon code",
		}, nil // Not an error, just failed application
	}

	if !coupon.IsActive {
		return &domain.ComputeResult{
			Success: false,
			Message: "Coupon is inactive",
		}, nil
	}

	if coupon.UsageLimit > 0 && coupon.UsageCount >= coupon.UsageLimit {
		return &domain.ComputeResult{
			Success: false,
			Message: "Coupon usage limit exceeded",
		}, nil
	}

	// --- LOGIC PORTED FROM test.go ---

	// Pre-calculation
	var productsInCoupon = make(map[string][]string) // tag -> []itemID
	var productIdPrice = make(map[string]float64)
	var totalCartAmount float64 = 0

	for _, item := range cart.Items {
		for _, tag := range item.Tags {
			productsInCoupon[tag] = append(productsInCoupon[tag], item.ItemID)
		}
		itemTotal := item.Price * float64(item.Quantity)
		totalCartAmount += itemTotal
		productIdPrice[item.ItemID] = itemTotal
	}

	var discountAmount float64
	var reason string = "Coupon applied successfully"
	var success = true

	if coupon.Level == domain.LevelCart {
		if totalCartAmount < coupon.MinOrderAmount {
			reason = "Insufficient cart amount for coupon application"
			success = false
		} else if coupon.Type == domain.DiscountTypePercentage {
			rawDiscount := (coupon.DiscountAmount / 100) * totalCartAmount
			discountAmount = math.Min(rawDiscount, coupon.MaxDiscount)
		} else {
			discountAmount = coupon.DiscountAmount
		}
	} else if coupon.Level == domain.LevelTag {
		// Logic for tag level
		uniqueProductIds := make(map[string]struct{})
		for _, tag := range coupon.ApplicableTags {
			for _, pid := range productsInCoupon[tag] {
				uniqueProductIds[pid] = struct{}{}
			}
		}

		var totalTagLevelAmount float64 = 0
		for pid := range uniqueProductIds {
			totalTagLevelAmount += productIdPrice[pid]
		}

		if totalTagLevelAmount < coupon.MinOrderAmount {
			reason = "Insufficient cart amount for eligible items"
			success = false
		} else if coupon.Type == domain.DiscountTypePercentage {
			rawDiscount := (coupon.DiscountAmount / 100) * totalTagLevelAmount
			discountAmount = math.Min(rawDiscount, coupon.MaxDiscount)
		} else {
			discountAmount = coupon.DiscountAmount
		}
	} else {
		return nil, fmt.Errorf("unknown coupon level: %s", coupon.Level)
	}

	if !success {
		discountAmount = 0
	}

	return &domain.ComputeResult{
		CouponID:       coupon.ID,
		DiscountAmount: discountAmount,
		Message:        reason,
		Success:        success,
	}, nil
}

func (s *ComputationService) CreateCoupon(c *domain.Coupon) error {
	// Validate: Check if code already exists in THIS organization
	existingCoupons, _ := s.repo.FindAll(c.OrgName)
	for _, existing := range existingCoupons {
		if existing.Code == c.Code {
			return fmt.Errorf("coupon code already exists in this organization")
		}
	}
	return s.repo.Save(c)
}

func (s *ComputationService) GetAllCoupons(orgName string) ([]domain.Coupon, error) {
	return s.repo.FindAll(orgName)
}

package service

import (
	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"
	"fmt"
	"log/slog"
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

	// Delegate logic
	summary := s.calculateCartSummary(cart)
	return s.applyCouponLogic(cart, *coupon, summary)
}

func (s *ComputationService) EvaluateAllCoupons(cart domain.Cart, orgName string) ([]domain.ComputeResult, error) {
	slog.Info("Starting evaluation", "org", orgName)
	coupons, err := s.repo.FindAll(orgName)
	if err != nil {
		slog.Error("Failed to fetch coupons", "error", err)
		return nil, err
	}

	slog.Info("Found coupons", "count", len(coupons), "org", orgName)

	// Pre-calculate cart summary once
	summary := s.calculateCartSummary(cart)

	var results []domain.ComputeResult
	for _, coupon := range coupons {
		if !coupon.IsActive {
			continue
		}

		res, err := s.applyCouponLogic(cart, coupon, summary)
		if err == nil && res.Success {
			slog.Info("Coupon applied", "code", coupon.Code, "discount", res.DiscountAmount)
			results = append(results, *res)
		} else {
			reason := "unknown"
			if res != nil {
				reason = res.Message
			}
			slog.Info("Coupon rejected", "code", coupon.Code, "reason", reason)
		}
	}

	slog.Info("Evaluation complete", "applicable_count", len(results))
	return results, nil
}

type cartSummary struct {
	productsInCoupon map[string][]string // tag -> []itemID
	productIdPrice   map[string]float64
	totalCartAmount  float64
}

func (s *ComputationService) calculateCartSummary(cart domain.Cart) *cartSummary {
	summary := &cartSummary{
		productsInCoupon: make(map[string][]string),
		productIdPrice:   make(map[string]float64),
		totalCartAmount:  0,
	}

	for _, item := range cart.Items {
		for _, tag := range item.Tags {
			summary.productsInCoupon[tag] = append(summary.productsInCoupon[tag], item.ItemID)
		}
		itemTotal := item.Price * float64(item.Quantity)
		summary.totalCartAmount += itemTotal
		summary.productIdPrice[item.ItemID] = itemTotal
	}
	return summary
}

func (s *ComputationService) applyCouponLogic(cart domain.Cart, coupon domain.Coupon, summary *cartSummary) (*domain.ComputeResult, error) {
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

	var discountAmount float64
	var reason string = "Coupon applied successfully"
	var success = true

	if coupon.Level == domain.LevelCart {
		if summary.totalCartAmount < coupon.MinOrderAmount {
			reason = "Insufficient cart amount for coupon application"
			success = false
		} else if coupon.Type == domain.DiscountTypePercentage {
			rawDiscount := (coupon.DiscountAmount / 100) * summary.totalCartAmount
			discountAmount = math.Min(rawDiscount, coupon.MaxDiscount)
		} else {
			discountAmount = coupon.DiscountAmount
		}
	} else if coupon.Level == domain.LevelTag {
		// Logic for tag level
		uniqueProductIds := make(map[string]struct{})
		for _, tag := range coupon.ApplicableTags {
			for _, pid := range summary.productsInCoupon[tag] {
				uniqueProductIds[pid] = struct{}{}
			}
		}

		var totalTagLevelAmount float64 = 0
		for pid := range uniqueProductIds {
			totalTagLevelAmount += summary.productIdPrice[pid]
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
		CouponCode:     coupon.Code,
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

func (s *ComputationService) UpdateCoupon(c *domain.Coupon) error {
	// 1. Fetch Existing
	existing, err := s.repo.FindByID(c.ID)
	if err != nil {
		return err
	}

	// 2. Verify Ownership
	if existing.OrgName != c.OrgName {
		return fmt.Errorf("unauthorized: coupon does not belong to this organization")
	}

	// 3. Unique Check (if code changed)
	if existing.Code != c.Code {
		orgCoupons, _ := s.repo.FindAll(c.OrgName)
		for _, other := range orgCoupons {
			if other.ID != c.ID && other.Code == c.Code {
				return fmt.Errorf("coupon code already exists in this organization")
			}
		}
	}

	// 4. Preserve Immutable Fields
	c.CreatedAt = existing.CreatedAt
	c.UsageCount = existing.UsageCount // System managed

	// 5. Update
	return s.repo.Update(c)
}

func (s *ComputationService) DeleteCoupon(id string, orgName string) error {
	// 1. Fetch Existing
	existing, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	// 2. Verify Ownership
	if existing.OrgName != orgName {
		return fmt.Errorf("unauthorized: coupon does not belong to this organization")
	}

	// 3. Delete
	return s.repo.Delete(id)
}

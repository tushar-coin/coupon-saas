package service

import (
	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"
	"fmt"
	"log/slog"
	"math"
	"strings"
	"time"
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
			Success:    false,
			Message:    "Invalid coupon code",
			ReasonCode: domain.ReasonInvalidCode,
		}, nil // Not an error, just failed application
	}

	// Delegate all validation and calculation logic
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
		res, err := s.applyCouponLogic(cart, coupon, summary)
		if err != nil {
			slog.Error("Error evaluating coupon", "code", coupon.Code, "error", err)
			continue
		}

		if res.Success {
			slog.Info("Coupon applied", "code", coupon.Code, "discount", res.DiscountAmount)
		} else {
			slog.Info("Coupon rejected", "code", coupon.Code, "reason", res.Message)
		}
		// Append all results, effective or not, for debugging/testing
		results = append(results, *res)
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
			lowerTag := strings.ToLower(tag)
			summary.productsInCoupon[lowerTag] = append(summary.productsInCoupon[lowerTag], item.ItemID)
		}
		itemTotal := item.Price * float64(item.Quantity)
		summary.totalCartAmount += itemTotal
		summary.productIdPrice[item.ItemID] = itemTotal
	}
	return summary
}

func (s *ComputationService) applyCouponLogic(cart domain.Cart, coupon domain.Coupon, summary *cartSummary) (*domain.ComputeResult, error) {
	// 1. Validation Rules
	if failure := s.validateRules(coupon); failure != nil {
		return failure, nil
	}

	// 2. Determine Eligible Amount (Strategy based on Level)
	eligibleAmount := s.calculateEligibleAmount(coupon, summary)

	// 3. Min Order Check using eligible amount
	if eligibleAmount < coupon.MinOrderAmount {
		missing := coupon.MinOrderAmount - eligibleAmount
		return &domain.ComputeResult{
			Success:       false,
			Message:       fmt.Sprintf("Add $%.2f more to apply this coupon", missing),
			ReasonCode:    domain.ReasonMinOrderNotMet,
			MissingAmount: missing,
			CouponCode:    coupon.Code,
			CouponID:      coupon.ID,
		}, nil
	}

	// 4. Calculate Discount (Strategy based on Type)
	discountAmount := s.calculateDiscount(coupon, eligibleAmount)

	return &domain.ComputeResult{
		Success:        true,
		CouponID:       coupon.ID,
		CouponCode:     coupon.Code,
		DiscountAmount: discountAmount,
		Message:        "Coupon applied successfully",
		ReasonCode:     domain.ReasonSuccess,
	}, nil
}

// -- Helpers --

func (s *ComputationService) validateRules(coupon domain.Coupon) *domain.ComputeResult {
	if !coupon.IsActive {
		return &domain.ComputeResult{
			Success:    false,
			Message:    "Coupon is inactive",
			ReasonCode: domain.ReasonInactive,
			CouponCode: coupon.Code,
			CouponID:   coupon.ID,
		}
	}

	if coupon.ExpiryDate != nil && time.Now().After(*coupon.ExpiryDate) {
		return &domain.ComputeResult{
			Success:    false,
			Message:    "Coupon has expired",
			ReasonCode: domain.ReasonExpired,
			CouponCode: coupon.Code,
			CouponID:   coupon.ID,
		}
	}

	if coupon.UsageLimit > 0 && coupon.UsageCount >= coupon.UsageLimit {
		return &domain.ComputeResult{
			Success:    false,
			Message:    "Coupon usage limit exceeded",
			ReasonCode: domain.ReasonUsageLimitExceeded,
			CouponCode: coupon.Code,
			CouponID:   coupon.ID,
		}
	}

	return nil
}

func (s *ComputationService) calculateEligibleAmount(coupon domain.Coupon, summary *cartSummary) float64 {
	if coupon.Level == domain.LevelCart {
		return summary.totalCartAmount
	} else if coupon.Level == domain.LevelTag {
		uniqueProductIds := make(map[string]struct{})
		for _, tag := range coupon.ApplicableTags {
			lowerTag := strings.ToLower(tag)
			for _, pid := range summary.productsInCoupon[lowerTag] {
				uniqueProductIds[pid] = struct{}{}
			}
		}

		var total float64
		for pid := range uniqueProductIds {
			total += summary.productIdPrice[pid]
		}
		return total
	}
	return 0
}

func (s *ComputationService) calculateDiscount(coupon domain.Coupon, eligibleAmount float64) float64 {
	var discount float64
	if coupon.Type == domain.DiscountTypePercentage {
		discount = (coupon.DiscountAmount / 100) * eligibleAmount
		if coupon.MaxDiscount > 0 {
			discount = math.Min(discount, coupon.MaxDiscount)
		}
	} else {
		// Fixed amount
		discount = coupon.DiscountAmount
	}
	// Cannot exceed eligible amount (optional/business rule dependent, usually good practice)
	return math.Min(discount, eligibleAmount)
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

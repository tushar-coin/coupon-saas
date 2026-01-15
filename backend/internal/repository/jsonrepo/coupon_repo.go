package jsonrepo

import (
	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

type FileCouponRepository struct {
	mu       sync.RWMutex
	filePath string
	coupons  map[string]domain.Coupon // In-memory cache
}

// Ensure it implements the interface
var _ ports.CouponRepository = (*FileCouponRepository)(nil)

func NewFileCouponRepository(filePath string) *FileCouponRepository {
	repo := &FileCouponRepository{
		filePath: filePath,
		coupons:  make(map[string]domain.Coupon),
	}
	// Try loading existing data or creating file
	repo.load()
	return repo
}

func (r *FileCouponRepository) load() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	file, err := os.ReadFile(r.filePath)
	if os.IsNotExist(err) {
		// Create empty file
		return r.flush()
	} else if err != nil {
		return err
	}

	if len(file) == 0 {
		return nil
	}

	// We store as a list in JSON for readabilty, or map. Let's do list.
	var couponList []domain.Coupon
	if err := json.Unmarshal(file, &couponList); err != nil {
		return err
	}

	for _, c := range couponList {
		r.coupons[c.ID] = c
	}
	return nil
}

func (r *FileCouponRepository) flush() error {
	// Must be called under lock
	var list []domain.Coupon
	for _, c := range r.coupons {
		list = append(list, c)
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(r.filePath, data, 0644)
}

func (r *FileCouponRepository) Save(coupon *domain.Coupon) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Check for uniqueness of code if new (?)
	// For simplicity, just overwrite ID for now
	r.coupons[coupon.ID] = *coupon
	return r.flush()
}

func (r *FileCouponRepository) FindByID(id string) (*domain.Coupon, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if c, ok := r.coupons[id]; ok {
		return &c, nil
	}
	return nil, fmt.Errorf("coupon not found")
}

func (r *FileCouponRepository) FindByCode(code string) (*domain.Coupon, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.coupons {
		if c.Code == code {
			return &c, nil
		}
	}
	return nil, fmt.Errorf("coupon not found")
}

func (r *FileCouponRepository) FindAll(orgName string) ([]domain.Coupon, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Coupon
	for _, c := range r.coupons {
		if c.OrgName == orgName {
			list = append(list, c)
		}
	}
	return list, nil
}

func (r *FileCouponRepository) Update(coupon *domain.Coupon) error {
	return r.Save(coupon)
}

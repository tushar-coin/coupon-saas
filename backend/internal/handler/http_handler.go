package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"coupon-backend/internal/domain"
	"coupon-backend/internal/service"

	"github.com/google/uuid"
)

type Handler struct {
	svc *service.ComputationService
}

func NewHandler(svc *service.ComputationService) *Handler {
	return &Handler{svc: svc}
}

// EnableCORS Middleware
func (h *Handler) EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// In production, restrict Origin to your dashboard domain
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// HealthCheck for the root path
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Backend is running! Coupon Service API v1."))
}

// POST /api/v1/public/compute
func (h *Handler) ComputeDiscount(w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Cart       domain.Cart `json:"cart"`
		CouponCode string      `json:"coupon_code"`
	}

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := h.svc.ComputeDiscount(req.Cart, req.CouponCode)
	if err != nil {
		// Internal server error or bad logic
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// POST /api/v1/dashboard/coupons
func (h *Handler) CreateCoupon(w http.ResponseWriter, r *http.Request) {
	// 1. Extract OrgName from Context (set by AuthMiddleware)
	orgName := r.Context().Value("org_name").(string)

	var coupon domain.Coupon
	if err := json.NewDecoder(r.Body).Decode(&coupon); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set Defaults
	if coupon.ID == "" {
		coupon.ID = uuid.New().String()
	}
	coupon.CreatedAt = time.Now()
	coupon.OrgName = orgName // Force Org Name

	err := h.svc.CreateCoupon(&coupon)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(coupon)
}

// GET /api/v1/dashboard/coupons
func (h *Handler) GetAllCoupons(w http.ResponseWriter, r *http.Request) {
	orgName := r.Context().Value("org_name").(string)

	coupons, err := h.svc.GetAllCoupons(orgName)
	if err != nil {
		http.Error(w, "Failed to fetch coupons", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(coupons)
}

// PUT /api/v1/dashboard/coupons/{id}
func (h *Handler) UpdateCoupon(w http.ResponseWriter, r *http.Request) {
	orgName := r.Context().Value("org_name").(string)
	id := r.PathValue("id")

	var coupon domain.Coupon
	if err := json.NewDecoder(r.Body).Decode(&coupon); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	coupon.ID = id
	coupon.OrgName = orgName

	err := h.svc.UpdateCoupon(&coupon)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(coupon)
}

// DELETE /api/v1/dashboard/coupons/{id}
func (h *Handler) DeleteCoupon(w http.ResponseWriter, r *http.Request) {
	orgName := r.Context().Value("org_name").(string)
	id := r.PathValue("id")

	if err := h.svc.DeleteCoupon(id, orgName); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

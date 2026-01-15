package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"coupon-backend/internal/domain"
	"coupon-backend/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// POST /api/v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" || req.OrgName == "" {
		http.Error(w, "All fields (email, password, org_name) are required", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 8 {
		http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	user, org, err := h.svc.Register(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      "Registration successful. Please check your email to verify your account.",
		"user":         user.ToResponse(),
		"organization": org.ToResponse(),
	})
}

// POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.Login(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GET /api/v1/auth/verify-email?token=xyz
func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing verification token", http.StatusBadRequest)
		return
	}

	err := h.svc.VerifyEmail(token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Email verified successfully. You can now log in.",
	})
}

// POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req domain.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Always return success to prevent email enumeration
	_ = h.svc.RequestPasswordReset(req.Email, req.OrgName)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "If an account exists with this email, a password reset link has been sent.",
	})
}

// POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req domain.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Token == "" || req.NewPassword == "" {
		http.Error(w, "Token and new password are required", http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 8 {
		http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	err := h.svc.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Password reset successful. You can now log in with your new password.",
	})
}

// POST /api/v1/auth/upload-logo
func (h *AuthHandler) UploadLogo(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if len(authHeader) < 7 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	claims, err := h.svc.VerifyToken(authHeader[7:])
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := claims["user_id"].(string)

	r.ParseMultipartForm(10 << 20)
	file, header, err := r.FormFile("logo")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		http.Error(w, "Only JPG and PNG allowed", http.StatusBadRequest)
		return
	}

	uploadDir := "data/uploads"
	os.MkdirAll(uploadDir, os.ModePerm)

	filename := fmt.Sprintf("%s_logo%s", userID, ext)
	savePath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(savePath)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file content", http.StatusInternalServerError)
		return
	}

	logoURL := fmt.Sprintf("http://localhost:8081/uploads/%s", filename)

	if err := h.svc.UploadLogo(userID, logoURL); err != nil {
		http.Error(w, "Error updating profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"logo_url": logoURL})
}

// AuthMiddleware protects routes and injects user claims into context
func (h *AuthHandler) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization Header", http.StatusUnauthorized)
			return
		}

		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			http.Error(w, "Invalid Authorization Header Format", http.StatusUnauthorized)
			return
		}
		tokenString := authHeader[7:]

		claims, err := h.svc.VerifyToken(tokenString)
		if err != nil {
			http.Error(w, "Invalid or Expired Token", http.StatusUnauthorized)
			return
		}

		// Inject all claims into context
		ctx := r.Context()
		ctx = context.WithValue(ctx, "user_id", claims["user_id"])
		ctx = context.WithValue(ctx, "org_id", claims["org_id"])
		ctx = context.WithValue(ctx, "org_name", claims["org_name"])
		ctx = context.WithValue(ctx, "role", claims["role"])

		fmt.Printf("Auth: user=%v, org=%v, role=%v\n", claims["user_id"], claims["org_name"], claims["role"])
		next(w, r.WithContext(ctx))
	}
}

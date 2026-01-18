package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"coupon-backend/internal/handler"
	"coupon-backend/internal/repository/jsonrepo"
	"coupon-backend/internal/service"
	"coupon-backend/pkg/logger"
)

func main() {
	// 0. Initialize Logger
	logger.InitLogger()

	// Load .env
	if err := godotenv.Load(); err != nil {
		slog.Warn("⚠️  .env file not found or failed to load. Using system env vars.")
	}

	// Load .env
	if err := godotenv.Load(); err != nil {
		slog.Warn("⚠️  .env file not found or failed to load. Using system env vars.")
	}

	// 1. Initialize Repositories
	dataDir := "./data"
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		os.Mkdir(dataDir, 0755)
	}

	couponRepo := jsonrepo.NewFileCouponRepository(dataDir + "/coupons.json")
	userRepo := jsonrepo.NewFileUserRepository(dataDir + "/users.json")
	orgRepo := jsonrepo.NewFileOrganizationRepository(dataDir + "/organizations.json")
	inviteRepo := jsonrepo.NewFileInvitationRepository(dataDir + "/invitations.json")

	// 2. Initialize Services
	// Email Config
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPass := os.Getenv("SMTP_PASSWORD")

	// Helper to warn if mailer is not configured
	if smtpHost == "" || smtpEmail == "" {
		slog.Warn("⚠️  SMTP Config missing! Emails will fail to send.")
	}

	mailerSvc := service.NewMailerService(smtpHost, smtpPort, smtpEmail, smtpPass)

	computeSvc := service.NewComputationService(couponRepo)
	authSvc := service.NewAuthService(userRepo, orgRepo, mailerSvc)
	teamSvc := service.NewTeamService(userRepo, orgRepo, inviteRepo, mailerSvc)

	// 3. Initialize Handlers
	h := handler.NewHandler(computeSvc)
	authH := handler.NewAuthHandler(authSvc)
	teamH := handler.NewTeamHandler(teamSvc, authSvc)
	orgH := handler.NewOrgHandler(orgRepo)

	// 4. Setup Router
	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/", h.HealthCheck)

	// Public Widget API
	mux.HandleFunc("POST /api/v1/public/compute", h.ComputeDiscount)
	mux.HandleFunc("POST /api/v1/public/apply-coupons", h.ApplyCoupons)

	// Auth API (Public)
	mux.HandleFunc("POST /api/v1/auth/register", authH.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authH.Login)
	mux.HandleFunc("GET /api/v1/auth/verify-email", authH.VerifyEmail)
	mux.HandleFunc("POST /api/v1/auth/forgot-password", authH.ForgotPassword)
	mux.HandleFunc("POST /api/v1/auth/reset-password", authH.ResetPassword)

	// Team API (Public - Accept Invitation)
	mux.HandleFunc("POST /api/v1/team/accept-invitation", teamH.AcceptInvitation)

	// Static File Server
	fileServer := http.FileServer(http.Dir("data/uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fileServer))

	// Protected Auth APIs
	mux.HandleFunc("POST /api/v1/auth/upload-logo", authH.AuthMiddleware(authH.UploadLogo))

	// Protected Dashboard APIs
	mux.HandleFunc("GET /api/v1/dashboard/coupons", authH.AuthMiddleware(h.GetAllCoupons))
	mux.HandleFunc("POST /api/v1/dashboard/coupons", authH.AuthMiddleware(h.CreateCoupon))
	mux.HandleFunc("PUT /api/v1/dashboard/coupons/{id}", authH.AuthMiddleware(h.UpdateCoupon))
	mux.HandleFunc("DELETE /api/v1/dashboard/coupons/{id}", authH.AuthMiddleware(h.DeleteCoupon))

	// Protected Team APIs
	mux.HandleFunc("POST /api/v1/team/invite", authH.AuthMiddleware(teamH.InviteUser))
	mux.HandleFunc("GET /api/v1/team/members", authH.AuthMiddleware(teamH.ListMembers))
	mux.HandleFunc("GET /api/v1/team/invitations", authH.AuthMiddleware(teamH.ListInvitations))
	mux.HandleFunc("DELETE /api/v1/team/members/{userId}", authH.AuthMiddleware(teamH.RemoveMember))
	mux.HandleFunc("PUT /api/v1/team/members/{userId}/role", authH.AuthMiddleware(teamH.UpdateRole))
	mux.HandleFunc("DELETE /api/v1/team/invitations/{invitationId}", authH.AuthMiddleware(teamH.CancelInvitation))

	// Protected Organization APIs
	mux.HandleFunc("GET /api/v1/organization", authH.AuthMiddleware(orgH.GetOrganization))
	mux.HandleFunc("PUT /api/v1/organization/tags", authH.AuthMiddleware(orgH.UpdateTags))

	// Apply CORS
	handlerWithCORS := h.EnableCORS(mux)

	// Apply Logging Middleware
	handlerWithLogging := h.LoggingMiddleware(handlerWithCORS)

	// 5. Start Server
	port := ":8081"
	slog.Info("🚀 Backend Server starting", "port", port, "data_dir", dataDir)

	if err := http.ListenAndServe(port, handlerWithLogging); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}

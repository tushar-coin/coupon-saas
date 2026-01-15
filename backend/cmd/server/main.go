package main

import (
	"log"
	"net/http"
	"os"

	"coupon-backend/internal/handler"
	"coupon-backend/internal/repository/jsonrepo"
	"coupon-backend/internal/service"
)

func main() {
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
	computeSvc := service.NewComputationService(couponRepo)
	authSvc := service.NewAuthService(userRepo, orgRepo)
	teamSvc := service.NewTeamService(userRepo, orgRepo, inviteRepo)

	// 3. Initialize Handlers
	h := handler.NewHandler(computeSvc)
	authH := handler.NewAuthHandler(authSvc)
	teamH := handler.NewTeamHandler(teamSvc, authSvc)

	// 4. Setup Router
	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/", h.HealthCheck)

	// Public Widget API
	mux.HandleFunc("POST /api/v1/public/compute", h.ComputeDiscount)

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

	// Protected Team APIs
	mux.HandleFunc("POST /api/v1/team/invite", authH.AuthMiddleware(teamH.InviteUser))
	mux.HandleFunc("GET /api/v1/team/members", authH.AuthMiddleware(teamH.ListMembers))
	mux.HandleFunc("GET /api/v1/team/invitations", authH.AuthMiddleware(teamH.ListInvitations))
	mux.HandleFunc("DELETE /api/v1/team/members/{userId}", authH.AuthMiddleware(teamH.RemoveMember))
	mux.HandleFunc("PUT /api/v1/team/members/{userId}/role", authH.AuthMiddleware(teamH.UpdateRole))
	mux.HandleFunc("DELETE /api/v1/team/invitations/{invitationId}", authH.AuthMiddleware(teamH.CancelInvitation))

	// Apply CORS
	handlerWithCORS := h.EnableCORS(mux)

	// 5. Start Server
	port := ":8081"
	log.Printf("🚀 Backend Server starting on %s", port)
	log.Printf("   Data directory: %s", dataDir)

	if err := http.ListenAndServe(port, handlerWithCORS); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

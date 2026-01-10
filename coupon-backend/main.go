package main

import (
	api "example/coupon_computation/coupon-backend/handler"
	"example/coupon_computation/coupon-backend/middleware"
	"example/coupon_computation/coupon-backend/storage"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file (if exists); ignore error if missing
	_ = godotenv.Load(".env")

	if os.Getenv("MASTER_KEY") == "" {
		log.Fatal("MASTER_KEY must be set in environment or .env")
	}

	if err := storage.InitStore("keys.json"); err != nil {
		log.Fatalf("error initializing store: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/generate", api.GenerateHandler)
	mux.Handle("/hello", middleware.AuthMiddleware(http.HandlerFunc(api.HelloHandler)))

	fmt.Println("Server running at https://localhost:8443")
	log.Fatal(http.ListenAndServeTLS(":8443", "certs/server.crt", "certs/server.key", mux))
}

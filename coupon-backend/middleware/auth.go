package middleware

import (
	"bytes"
	"example/coupon_computation/coupon-backend/controller"
	"io"

	"net/http"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		sig := r.Header.Get("X-Signature")
		if apiKey == "" || sig == "" {
			http.Error(w, "missing auth", http.StatusUnauthorized)
			return
		}

		body, _ := io.ReadAll(r.Body)
		r.Body.Close()

		if !controller.VerifyHMAC(apiKey, body, sig) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		r.Body = io.NopCloser(bytes.NewReader(body))
		next.ServeHTTP(w, r)
	})
}

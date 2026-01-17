package handler

import (
	"bytes"
	"io"
	"log/slog"
	"net/http"
	"time"
)

// ResponseWriterWrapper wraps http.ResponseWriter to capture status and size
type ResponseWriterWrapper struct {
	http.ResponseWriter
	Status int
	Size   int
	Body   *bytes.Buffer
}

// WriteHeader captures the status code
func (w *ResponseWriterWrapper) WriteHeader(statusCode int) {
	w.Status = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

// Write captures the body size and content (if needed for logging)
func (w *ResponseWriterWrapper) Write(b []byte) (int, error) {
	if w.Status == 0 {
		w.Status = http.StatusOK
	}
	size, err := w.ResponseWriter.Write(b)
	w.Size += size
	w.Body.Write(b)
	return size, err
}

// LoggingMiddleware logs request and response details
func (h *Handler) LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 1. Read and restore request body
		var requestBody []byte
		if r.Body != nil {
			requestBody, _ = io.ReadAll(r.Body)
			r.Body = io.NopCloser(bytes.NewBuffer(requestBody)) // Restore
		}

		slog.Info("Incoming Request",
			"method", r.Method,
			"uri", r.RequestURI,
			"body", string(requestBody))

		// 2. Wrap ResponseWriter
		wrapper := &ResponseWriterWrapper{
			ResponseWriter: w,
			Status:         0,
			Body:           new(bytes.Buffer),
		}

		// 3. Serve
		next.ServeHTTP(wrapper, r)

		// 4. Log Response
		duration := time.Since(start)
		slog.Info("Outgoing Response",
			"status", wrapper.Status,
			"uri", r.RequestURI,
			"duration", duration.String(),
			"response", wrapper.Body.String())
	})
}

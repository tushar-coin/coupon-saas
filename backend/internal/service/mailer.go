package service

import (
	"fmt"
	"log/slog"
	"net/smtp"
)

type MailerService struct {
	host     string
	port     string
	email    string
	password string
}

func NewMailerService(host, port, email, password string) *MailerService {
	return &MailerService{
		host:     host,
		port:     port,
		email:    email,
		password: password,
	}
}

func (m *MailerService) Send(to, subject, body string) error {
	slog.Info("📧 Attempting to send email", "to", to, "subject", subject)

	// Setup authentication
	auth := smtp.PlainAuth("", m.email, m.password, m.host)

	// Create message
	// MIME headers for proper HTML email support
	headers := map[string]string{
		"From":         m.email,
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=\"UTF-8\"",
	}

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// Send email
	addr := fmt.Sprintf("%s:%s", m.host, m.port)
	if err := smtp.SendMail(addr, auth, m.email, []string{to}, []byte(message)); err != nil {
		slog.Error("❌ Failed to send email", "to", to, "error", err)
		return err
	}

	slog.Info("✅ Email sent successfully", "to", to)
	return nil
}

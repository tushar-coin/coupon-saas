package service

import (
	"fmt"
	"strings"
)

// Base Email Layout with CouponFlow Branding
// Colors: Gold (#D4AF37), Dark (#1E1E24), Light (#F8FAFC)
const baseLayout = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #1E1E24; padding: 24px; text-align: center; }
        .header-text { color: #D4AF37; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; text-transform: uppercase;}
        .content { padding: 40px 32px; color: #333333; line-height: 1.6; }
        .h1 { font-size: 22px; font-weight: 600; margin-bottom: 24px; color: #1E1E24; }
        .p { font-size: 16px; margin-bottom: 24px; color: #555555; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { background-color: #D4AF37; color: #1E1E24; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.9; }
        .footer { background-color: #f4f4f5; padding: 24px; text-align: center; font-size: 12px; color: #999999; }
        .footer a { color: #999999; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="header-text">CouponFlow</h1>
        </div>
        <div class="content">
            {{CONTENT}}
        </div>
        <div class="footer">
            <p>&copy; 2026 CouponFlow Inc. All rights reserved.</p>
            <p>123 SaaS Street, Tech City</p>
        </div>
    </div>
</body>
</html>
`

// Helper to inject content into base layout
func renderTemplate(content string) string {
	return strings.Replace(baseLayout, "{{CONTENT}}", content, 1)
}

// 1. Verify Email Template
func GetVerifyEmailTemplate(url string) string {
	content := fmt.Sprintf(`
        <div class="h1">Verify your email address</div>
        <div class="p">Welcome to CouponFlow! We're excited to have you on board.</div>
        <div class="p">Please verify your email address to secure your account and access all features.</div>
        <div class="btn-container">
            <a href="%s" class="btn">Verify Email Address</a>
        </div>
        <div class="p">If you didn't create an account, you can safely ignore this email.</div>
    `, url)
	return renderTemplate(content)
}

// 2. Reset Password Template
func GetResetPasswordTemplate(url string) string {
	content := fmt.Sprintf(`
        <div class="h1">Reset your password</div>
        <div class="p">We received a request to reset the password for your CouponFlow account.</div>
        <div class="p">Click the button below to set up a new password. This link is valid for 15 minutes.</div>
        <div class="btn-container">
            <a href="%s" class="btn">Reset Password</a>
        </div>
        <div class="p">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</div>
    `, url)
	return renderTemplate(content)
}

// 3. Team Invitation Template
func GetInvitationTemplate(orgName, role, url string) string {
	content := fmt.Sprintf(`
        <div class="h1">You've been invited!</div>
        <div class="p">You have been invited to join the <strong>%s</strong> team on CouponFlow.</div>
        <div class="p">Role: <strong>%s</strong></div>
        <div class="btn-container">
            <a href="%s" class="btn">Accept Invitation</a>
        </div>
        <div class="p">This invitation will expire in 7 days. If you don't want to join this team, you can ignore this email.</div>
    `, orgName, role, url)
	return renderTemplate(content)
}

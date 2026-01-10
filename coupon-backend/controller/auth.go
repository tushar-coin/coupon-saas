package controller

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

func VerifyHMAC(apiKey string, body []byte, sig string) bool {
	mac := hmac.New(sha256.New, []byte(apiKey))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(sig))
}

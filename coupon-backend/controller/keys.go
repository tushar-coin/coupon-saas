package controller

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"example/coupon_computation/coupon-backend/crypto"
	"example/coupon_computation/coupon-backend/entity"
	"example/coupon_computation/coupon-backend/storage"
	"fmt"
	"os"
)

func GenerateAPIKeyLogic() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	apiKey := hex.EncodeToString(raw)

	masterKeyB64 := os.Getenv("MASTER_KEY")
	if masterKeyB64 == "" {
		return "", errors.New("MASTER_KEY not set")
	}
	masterKey, _ := hex.DecodeString(masterKeyB64)

	fmt.Println("encrypting the API key...")
	encrypted, err := crypto.Encrypt(masterKey, apiKey)
	if err != nil {
		return "", err
	}
	fmt.Println("API key encrypted successfully.")

	fmt.Println("saving the API key...")
	if err := storage.SaveEncryptedKey(entity.KeyRecord{
		Ciphertext: encrypted,
		// TODO: pass the org values here.
		OrgDetails: entity.OrgDetails{
			ID:   "org-123",
			Name: "Example Organization",
		},
	}); err != nil {
		return "", err
	}
	fmt.Println("API key saved successfully.")

	return apiKey, nil
}

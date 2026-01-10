package controller

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"example/coupon_computation/coupon-backend/crypto"
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
	if err := storage.SaveEncryptedKey(apiKey, encrypted); err != nil {
		return "", err
	}
	fmt.Println("API key saved successfully.")

	return apiKey, nil
}

func GetAPIKey(id string) (string, error) {
	masterKeyB64 := os.Getenv("MASTER_KEY")
	if masterKeyB64 == "" {
		return "", errors.New("MASTER_KEY not set")
	}
	masterKey, _ := hex.DecodeString(masterKeyB64)

	enc, ok := storage.FindEncryptedKey(id)
	if !ok {
		return "", errors.New("not found")
	}
	return crypto.Decrypt(masterKey, enc)
}

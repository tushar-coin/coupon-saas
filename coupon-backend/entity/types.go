package entity

import (
	"sync"
)

type GenerateResponse struct {
	APIKey string `json:"api_key"`
}

type HelloRequest struct {
	Message string `json:"message"`
}

type HelloResponse struct {
	Greeting string `json:"greeting"`
}

type OrgDetails struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type KeyRecord struct {
	Ciphertext string     `json:"ciphertext"`  // this is the encrypted API key
	OrgDetails OrgDetails `json:"org_details"` // this contains organization-specific information
}

type Store struct {
	mu   sync.Mutex
	Keys []KeyRecord `json:"keys"`
}

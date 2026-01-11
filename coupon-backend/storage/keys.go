package storage

import (
	"encoding/json"
	"example/coupon_computation/coupon-backend/entity"
	"fmt"
	"os"
	"sync"
)

var (
	keyFile   string
	fileMutex sync.RWMutex
)

func InitStore(file string) error {
	keyFile = file

	f, err := os.Open(file)
	if err != nil {
		return err
	}
	defer f.Close()
	return nil
}

func ReadKeyStore(filePath string) (*entity.KeyRecord, error) {
	var result entity.KeyRecord

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	if !json.Valid(data) {
		return nil, fmt.Errorf("invalid json")
	}

	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func SaveEncryptedKey(record entity.KeyRecord) error {
	// Read existing file
	data, err := os.ReadFile(keyFile)
	if err != nil {
		return err
	}

	// Unmarshal into slice
	var records []entity.KeyRecord
	if len(data) != 0 {
		if err := json.Unmarshal(data, &records); err != nil {
			return err
		}
	}

	// Append new record
	records = append(records, record)

	// Marshal back to JSON
	updatedData, err := json.MarshalIndent(records, "", "  ")
	if err != nil {
		return err
	}

	// Write back to file
	return os.WriteFile(keyFile, updatedData, 0644)
}

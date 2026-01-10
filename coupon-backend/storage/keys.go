package storage

import (
	"encoding/json"
	"os"
	"sync"
)

type KeyRecord struct {
	ID         string `json:"id"`
	Ciphertext string `json:"ciphertext"`
}

type Store struct {
	mu   sync.Mutex
	Keys []KeyRecord `json:"keys"`
}

var (
	keyStore = &Store{Keys: []KeyRecord{}}
	keyFile  string
)

func InitStore(file string) error {
	keyFile = file

	f, err := os.Open(file)
	if err != nil {
		if os.IsNotExist(err) {
			keyStore.mu.Lock()
			defer keyStore.mu.Unlock()
			return persistLocked()
		}
		return err
	}
	defer f.Close()

	keyStore.mu.Lock()
	defer keyStore.mu.Unlock()
	return json.NewDecoder(f).Decode(keyStore)
}

// persistLocked MUST be called with keyStore.mu already locked
func persistLocked() error {
	temp := keyFile + ".tmp"

	f, err := os.Create(temp)
	if err != nil {
		return err
	}

	if err := json.NewEncoder(f).Encode(keyStore); err != nil {
		f.Close()
		_ = os.Remove(temp)
		return err
	}

	if err := f.Close(); err != nil {
		return err
	}

	return os.Rename(temp, keyFile)
}

func SaveEncryptedKey(id, ciphertext string) error {
	keyStore.mu.Lock()
	defer keyStore.mu.Unlock()

	keyStore.Keys = append(keyStore.Keys, KeyRecord{
		ID:         id,
		Ciphertext: ciphertext,
	})

	return persistLocked()
}

func FindEncryptedKey(id string) (string, bool) {
	keyStore.mu.Lock()
	defer keyStore.mu.Unlock()

	for _, rec := range keyStore.Keys {
		if rec.ID == id {
			return rec.Ciphertext, true
		}
	}
	return "", false
}

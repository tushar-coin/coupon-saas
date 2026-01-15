package jsonrepo

import (
	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
)

type FileUserRepository struct {
	mu       sync.RWMutex
	filePath string
	users    map[string]domain.User
}

var _ ports.UserRepository = (*FileUserRepository)(nil)

func NewFileUserRepository(filePath string) *FileUserRepository {
	repo := &FileUserRepository{
		filePath: filePath,
		users:    make(map[string]domain.User),
	}
	repo.load()
	return repo
}

func (r *FileUserRepository) load() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	file, err := os.ReadFile(r.filePath)
	if os.IsNotExist(err) {
		return r.flush()
	} else if err != nil {
		return err
	}

	if len(file) == 0 {
		return nil
	}

	var userList []domain.User
	if err := json.Unmarshal(file, &userList); err != nil {
		return err
	}

	for _, u := range userList {
		r.users[u.ID] = u
	}
	return nil
}

func (r *FileUserRepository) flush() error {
	var list []domain.User
	for _, u := range r.users {
		list = append(list, u)
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(r.filePath, data, 0644)
}

func (r *FileUserRepository) Save(user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.users[user.ID] = *user
	return r.flush()
}

func (r *FileUserRepository) FindByEmailAndOrg(email, orgName string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		// Case-insensitive org name comparison
		if u.Email == email && strings.EqualFold(u.OrgName, orgName) {
			return &u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (r *FileUserRepository) FindByID(id string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if u, ok := r.users[id]; ok {
		return &u, nil
	}
	return nil, fmt.Errorf("user not found")
}

func (r *FileUserRepository) FindByOrgID(orgID string) ([]domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []domain.User
	for _, u := range r.users {
		if u.OrgID == orgID {
			result = append(result, u)
		}
	}
	return result, nil
}

func (r *FileUserRepository) FindByResetToken(hashedToken string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if u.ResetToken == hashedToken && !u.ResetTokenUsed {
			return &u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (r *FileUserRepository) FindByVerificationToken(hashedToken string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if u.VerificationToken == hashedToken {
			return &u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (r *FileUserRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.users, id)
	return r.flush()
}

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

type FileOrganizationRepository struct {
	mu       sync.RWMutex
	filePath string
	orgs     map[string]domain.Organization // ID -> Organization
}

var _ ports.OrganizationRepository = (*FileOrganizationRepository)(nil)

func NewFileOrganizationRepository(filePath string) *FileOrganizationRepository {
	repo := &FileOrganizationRepository{
		filePath: filePath,
		orgs:     make(map[string]domain.Organization),
	}
	repo.load()
	return repo
}

func (r *FileOrganizationRepository) load() error {
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

	var orgList []domain.Organization
	if err := json.Unmarshal(file, &orgList); err != nil {
		return err
	}

	for _, o := range orgList {
		r.orgs[o.ID] = o
	}
	return nil
}

func (r *FileOrganizationRepository) flush() error {
	var list []domain.Organization
	for _, o := range r.orgs {
		list = append(list, o)
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(r.filePath, data, 0644)
}

func (r *FileOrganizationRepository) Save(org *domain.Organization) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.orgs[org.ID] = *org
	return r.flush()
}

func (r *FileOrganizationRepository) FindByID(id string) (*domain.Organization, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if o, ok := r.orgs[id]; ok {
		return &o, nil
	}
	return nil, fmt.Errorf("organization not found")
}

func (r *FileOrganizationRepository) FindByName(name string) (*domain.Organization, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, o := range r.orgs {
		// Case-insensitive comparison
		if strings.EqualFold(o.Name, name) {
			return &o, nil
		}
	}
	return nil, fmt.Errorf("organization not found")
}

func (r *FileOrganizationRepository) Exists(name string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, o := range r.orgs {
		// Case-insensitive comparison
		if strings.EqualFold(o.Name, name) {
			return true
		}
	}
	return false
}

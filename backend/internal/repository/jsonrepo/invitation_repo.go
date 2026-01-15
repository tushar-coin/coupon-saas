package jsonrepo

import (
	"coupon-backend/internal/domain"
	"coupon-backend/internal/ports"
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

type FileInvitationRepository struct {
	mu          sync.RWMutex
	filePath    string
	invitations map[string]domain.Invitation // ID -> Invitation
}

var _ ports.InvitationRepository = (*FileInvitationRepository)(nil)

func NewFileInvitationRepository(filePath string) *FileInvitationRepository {
	repo := &FileInvitationRepository{
		filePath:    filePath,
		invitations: make(map[string]domain.Invitation),
	}
	repo.load()
	return repo
}

func (r *FileInvitationRepository) load() error {
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

	var invList []domain.Invitation
	if err := json.Unmarshal(file, &invList); err != nil {
		return err
	}

	for _, i := range invList {
		r.invitations[i.ID] = i
	}
	return nil
}

func (r *FileInvitationRepository) flush() error {
	var list []domain.Invitation
	for _, i := range r.invitations {
		list = append(list, i)
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(r.filePath, data, 0644)
}

func (r *FileInvitationRepository) Save(inv *domain.Invitation) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.invitations[inv.ID] = *inv
	return r.flush()
}

func (r *FileInvitationRepository) FindByToken(hashedToken string) (*domain.Invitation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, i := range r.invitations {
		if i.Token == hashedToken && i.AcceptedAt == nil {
			return &i, nil
		}
	}
	return nil, fmt.Errorf("invitation not found")
}

func (r *FileInvitationRepository) FindByOrgID(orgID string) ([]domain.Invitation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []domain.Invitation
	for _, i := range r.invitations {
		if i.OrgID == orgID {
			result = append(result, i)
		}
	}
	return result, nil
}

func (r *FileInvitationRepository) FindPendingByEmail(email string) ([]domain.Invitation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []domain.Invitation
	for _, i := range r.invitations {
		if i.Email == email && i.AcceptedAt == nil {
			result = append(result, i)
		}
	}
	return result, nil
}

func (r *FileInvitationRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.invitations, id)
	return r.flush()
}

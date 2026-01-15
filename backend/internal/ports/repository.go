package ports

import "coupon-backend/internal/domain"

type CouponRepository interface {
	Save(coupon *domain.Coupon) error
	FindByID(id string) (*domain.Coupon, error)
	FindByCode(code string) (*domain.Coupon, error)
	FindAll(orgName string) ([]domain.Coupon, error)
	Update(coupon *domain.Coupon) error
}

type UserRepository interface {
	Save(user *domain.User) error
	FindByEmailAndOrg(email, orgName string) (*domain.User, error)
	FindByID(id string) (*domain.User, error)
	FindByOrgID(orgID string) ([]domain.User, error)
	FindByResetToken(hashedToken string) (*domain.User, error)
	FindByVerificationToken(hashedToken string) (*domain.User, error)
	Delete(id string) error
}

type OrganizationRepository interface {
	Save(org *domain.Organization) error
	FindByID(id string) (*domain.Organization, error)
	FindByName(name string) (*domain.Organization, error)
	Exists(name string) bool
}

type InvitationRepository interface {
	Save(inv *domain.Invitation) error
	FindByToken(hashedToken string) (*domain.Invitation, error)
	FindByOrgID(orgID string) ([]domain.Invitation, error)
	FindPendingByEmail(email string) ([]domain.Invitation, error)
	Delete(id string) error
}

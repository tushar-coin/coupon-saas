package domain

import "time"

// Organization represents a company/team in the system
type Organization struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"` // Must be unique, used as identifier
	OwnerID   string    `json:"owner_id"`
	Tags      []string  `json:"tags"` // Product/category tags for coupon targeting
	CreatedAt time.Time `json:"created_at"`
}

// OrganizationResponse is safe for API responses
type OrganizationResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Tags      []string  `json:"tags"`
	CreatedAt time.Time `json:"created_at"`
}

func (o *Organization) ToResponse() OrganizationResponse {
	return OrganizationResponse{
		ID:        o.ID,
		Name:      o.Name,
		Tags:      o.Tags,
		CreatedAt: o.CreatedAt,
	}
}

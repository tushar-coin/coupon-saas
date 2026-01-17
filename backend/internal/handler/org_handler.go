package handler

import (
	"encoding/json"
	"net/http"

	"coupon-backend/internal/ports"
)

type OrgHandler struct {
	orgRepo ports.OrganizationRepository
}

func NewOrgHandler(orgRepo ports.OrganizationRepository) *OrgHandler {
	return &OrgHandler{orgRepo: orgRepo}
}

// GET /api/v1/organization - Get current organization details
func (h *OrgHandler) GetOrganization(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value("org_id").(string)

	org, err := h.orgRepo.FindByID(orgID)
	if err != nil {
		http.Error(w, "Organization not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(org.ToResponse())
}

// UpdateTagsRequest is the request body for updating tags
type UpdateTagsRequest struct {
	Tags []string `json:"tags"`
}

// PUT /api/v1/organization/tags - Update organization tags
func (h *OrgHandler) UpdateTags(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value("org_id").(string)

	var req UpdateTagsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	org, err := h.orgRepo.FindByID(orgID)
	if err != nil {
		http.Error(w, "Organization not found", http.StatusNotFound)
		return
	}

	// Update tags
	org.Tags = req.Tags

	if err := h.orgRepo.Update(org); err != nil {
		http.Error(w, "Failed to update organization", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Tags updated successfully",
		"tags":    org.Tags,
	})
}

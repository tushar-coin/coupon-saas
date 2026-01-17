import { useState } from "react";
import { Plus, X, Tag } from "lucide-react";
import "./TagManager.css";

export default function TagManager({ tags = [], onAddTag, onRemoveTag, isLoading }) {
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      setError("Please enter a tag name");
      return;
    }

    if (newTag.trim().length < 2) {
      setError("Tag must be at least 2 characters");
      return;
    }

    const result = await onAddTag(newTag);
    if (result.success) {
      setNewTag("");
      setError("");
    } else {
      setError(result.error || "Failed to add tag");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="tag-manager">
      <div className="tag-input-row">
        <div className="tag-input-wrapper">
          <Tag size={16} className="tag-input-icon" />
          <input
            type="text"
            className="tag-input"
            placeholder="Enter new category (e.g., Electronics, Clothing)"
            value={newTag}
            onChange={(e) => {
              setNewTag(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        <button 
          className="btn-add-tag" 
          onClick={handleAddTag}
          disabled={isLoading || !newTag.trim()}
        >
          <Plus size={18} />
          Add Tag
        </button>
      </div>

      {error && <span className="tag-error">{error}</span>}

      {tags.length > 0 ? (
        <div className="tags-list">
          <span className="tags-label">Your Categories:</span>
          <div className="tags-container">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button
                  className="tag-remove"
                  onClick={() => onRemoveTag(tag)}
                  disabled={isLoading}
                  title={`Remove ${tag}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="tags-empty">
          <Tag size={24} />
          <p>No categories defined yet.</p>
          <span>Add categories to target coupons to specific products.</span>
        </div>
      )}
    </div>
  );
}

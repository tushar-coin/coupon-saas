import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Tag, Search } from "lucide-react";
import "./TagSelector.css";

export default function TagSelector({ 
  availableTags = [], 
  selectedTags = [], 
  onChange,
  placeholder = "Select categories...",
  emptyMessage = "No categories available. Add them in Settings."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  const handleSelect = (tag) => {
    onChange([...selectedTags, tag]);
    setSearchTerm("");
  };

  const handleRemove = (tagToRemove) => {
    onChange(selectedTags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="tag-selector" ref={wrapperRef}>
      <div 
        className={`tag-selector-input ${isOpen ? 'focused' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <div className="selected-tags-area">
          {selectedTags.length > 0 ? (
            selectedTags.map(tag => (
              <span key={tag} className="selected-tag">
                {tag}
                <button 
                  type="button"
                  className="remove-tag" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(tag);
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          size={18} 
          className={`dropdown-icon ${isOpen ? 'rotated' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="tag-dropdown">
          <div className="tag-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="tag-search"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="tag-options">
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => (
                <div 
                  key={tag} 
                  className="tag-option"
                  onClick={() => handleSelect(tag)}
                >
                  <Tag size={14} />
                  {tag}
                </div>
              ))
            ) : availableTags.length === 0 ? (
              <div className="no-tags-message">
                <Tag size={20} />
                <span>{emptyMessage}</span>
              </div>
            ) : (
              <div className="no-results">No matching categories</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

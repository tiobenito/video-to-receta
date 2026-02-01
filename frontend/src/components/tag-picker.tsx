"use client";

import { useState, useRef, useEffect } from "react";
import { RecipeTag, RECIPE_TAGS } from "@/types/recipe";
import { t, translateTag } from "@/lib/translations";

interface TagPickerProps {
  selectedTags: RecipeTag[];
  onTagToggle: (tag: RecipeTag) => void;
  showAddButton?: boolean;
}

export function TagPicker({ selectedTags, onTagToggle, showAddButton = true }: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableTags = RECIPE_TAGS.filter((tag) => !selectedTags.includes(tag));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selectedTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagToggle(tag)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--teal)]/10 text-[var(--teal)] hover:bg-[var(--teal)]/20 transition-colors"
        >
          {translateTag(tag)}
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      ))}

      {showAddButton && availableTags.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-[var(--border-warm)] text-[var(--text-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("addTag")}
          </button>

          {isOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-[var(--border-warm)] max-h-48 overflow-y-auto min-w-[140px]">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onTagToggle(tag);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-body)] hover:bg-[var(--cream)] transition-colors"
                >
                  {translateTag(tag)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTags.length === 0 && !showAddButton && (
        <span className="text-xs text-[var(--text-muted)]">{t("noTags")}</span>
      )}
    </div>
  );
}

// Compact tag display for thumbnails
export function TagBadges({ tags }: { tags: RecipeTag[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--teal)]/10 text-[var(--teal)]"
        >
          {translateTag(tag)}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--cream-dark)] text-[var(--text-muted)]">
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
}

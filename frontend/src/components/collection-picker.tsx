"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Collection } from "@/types/collection";
import { getCollections, createCollection, deleteCollection } from "@/lib/collection-storage";
import { addRecipeToCollection, removeRecipeFromCollection } from "@/lib/recipe-storage";
import { t } from "@/lib/translations";

interface CollectionPickerProps {
  recipeId: string;
  selectedCollectionIds: string[];
  onUpdate: (collectionIds: string[]) => void;
}

export function CollectionPicker({
  recipeId,
  selectedCollectionIds,
  onUpdate,
}: CollectionPickerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);

  useEffect(() => {
    setCollections(getCollections());
  }, []);

  const handleToggleCollection = async (collectionId: string) => {
    const isSelected = selectedCollectionIds.includes(collectionId);
    if (isSelected) {
      await removeRecipeFromCollection(recipeId, collectionId);
      onUpdate(selectedCollectionIds.filter((id) => id !== collectionId));
    } else {
      await addRecipeToCollection(recipeId, collectionId);
      onUpdate([...selectedCollectionIds, collectionId]);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    const newCollection = createCollection(newCollectionName.trim());
    setCollections([...collections, newCollection]);
    setNewCollectionName("");
    setShowCreateInput(false);
    // Auto-add recipe to new collection
    await addRecipeToCollection(recipeId, newCollection.id);
    onUpdate([...selectedCollectionIds, newCollection.id]);
  };

  const handleDeleteCollection = (collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCollection(collectionId);
    setCollections(collections.filter((c) => c.id !== collectionId));
    if (selectedCollectionIds.includes(collectionId)) {
      onUpdate(selectedCollectionIds.filter((id) => id !== collectionId));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--cream-dark)] text-[var(--text-muted)] hover:text-[var(--teal)] hover:bg-[var(--cream)] transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        {selectedCollectionIds.length > 0 ? (
          <span>{selectedCollectionIds.length} {t("collections").toLowerCase()}</span>
        ) : (
          <span>{t("addToCollection")}</span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 z-20 w-64 bg-[var(--card-white)] rounded-lg shadow-lg border border-[var(--border-warm)] overflow-hidden">
            {/* Collection list */}
            <div className="max-h-48 overflow-y-auto">
              {collections.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--text-muted)]">
                  {t("noCollections")}
                </p>
              ) : (
                collections.map((collection) => {
                  const isSelected = selectedCollectionIds.includes(collection.id);
                  return (
                    <div
                      key={collection.id}
                      onClick={() => handleToggleCollection(collection.id)}
                      className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[var(--cream)]"
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-[var(--teal)] bg-[var(--teal)]"
                            : "border-[var(--border-warm)]"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1 text-sm text-[var(--text-body)]">
                        {collection.name}
                      </span>
                      <button
                        onClick={(e) => handleDeleteCollection(collection.id, e)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Create new collection */}
            <div className="border-t border-[var(--border-warm)] p-2">
              {showCreateInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
                    placeholder={t("collectionPlaceholder")}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--border-warm)] rounded bg-white focus:outline-none focus:border-[var(--teal)]"
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim()}
                    className="text-xs h-7 px-2"
                  >
                    +
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateInput(true)}
                  className="w-full text-left px-2 py-1 text-sm text-[var(--teal)] hover:bg-[var(--cream)] rounded"
                >
                  + {t("newCollection")}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Badge display for showing collection names
interface CollectionBadgesProps {
  collectionIds: string[];
}

export function CollectionBadges({ collectionIds }: CollectionBadgesProps) {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    setCollections(getCollections());
  }, []);

  const matchedCollections = collections.filter((c) => collectionIds.includes(c.id));

  if (matchedCollections.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {matchedCollections.map((collection) => (
        <span
          key={collection.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--gold)]/10 text-[var(--gold-dark)]"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {collection.name}
        </span>
      ))}
    </div>
  );
}

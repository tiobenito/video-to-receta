"use client";

import { Button } from "@/components/ui/button";
import { Recipe, SavedRecipe, Ingredient, Instruction, RecipeTag } from "@/types/recipe";
import { useState, useEffect } from "react";
import { t } from "@/lib/translations";
import {
  saveRecipe,
  isRecipeSaved,
  removeRecipe,
  getSavedRecipe,
  addTagToRecipe,
  removeTagFromRecipe,
  addNoteToRecipe,
  removeNoteFromRecipe,
  saveRecipeEdits,
  clearRecipeEdits,
} from "@/lib/recipe-storage";
import { convertIngredients, scaleIngredients, UnitSystem } from "@/lib/unit-conversion";
import { ServingsScaler } from "@/components/servings-scaler";
import { jsPDF } from "jspdf";
import { TagPicker } from "@/components/tag-picker";
import { CollectionPicker, CollectionBadges } from "@/components/collection-picker";
import { NutritionDisplay } from "@/components/nutrition-display";
import { addIngredientsToShoppingList } from "@/lib/shopping-storage";

interface RecipeCardProps {
  recipe: Recipe | SavedRecipe;
  showRemove?: boolean;
  onRemove?: () => void;
  onUpdate?: (recipe: SavedRecipe) => void;
}

function isSavedRecipe(recipe: Recipe | SavedRecipe): recipe is SavedRecipe {
  return "tags" in recipe && "notes" in recipe;
}

export function RecipeCard({ recipe, showRemove = false, onRemove, onUpdate }: RecipeCardProps) {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [savedRecipe, setSavedRecipe] = useState<SavedRecipe | null>(
    isSavedRecipe(recipe) ? recipe : null
  );
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [addedToList, setAddedToList] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedIngredients, setEditedIngredients] = useState<Ingredient[]>([]);
  const [editedInstructions, setEditedInstructions] = useState<Instruction[]>([]);
  const [editedPrepTime, setEditedPrepTime] = useState("");
  const [editedCookTime, setEditedCookTime] = useState("");
  const [editedServings, setEditedServings] = useState("");

  // Get effective values (user edits override original)
  const effectiveTitle = savedRecipe?.userEdits?.title ?? recipe.title;
  const effectiveIngredients = savedRecipe?.userEdits?.ingredients ?? recipe.ingredients;
  const effectiveInstructions = savedRecipe?.userEdits?.instructions ?? recipe.instructions;
  const effectivePrepTime = savedRecipe?.userEdits?.prepTime ?? recipe.prepTime;
  const effectiveCookTime = savedRecipe?.userEdits?.cookTime ?? recipe.cookTime;
  const effectiveServings = savedRecipe?.userEdits?.servings ?? recipe.servings;

  // Apply scaling first, then unit conversion
  const scaledIngredients = isEditing
    ? editedIngredients
    : scaleIngredients(effectiveIngredients, scaleFactor);
  const displayIngredients = convertIngredients(scaledIngredients, unitSystem);

  useEffect(() => {
    const saved = getSavedRecipe(recipe.videoId);
    if (saved) {
      setSavedRecipe(saved);
      setIsSaved(true);
    } else {
      setIsSaved(isRecipeSaved(recipe.videoId));
    }
  }, [recipe.videoId]);

  const startEditing = () => {
    setEditedTitle(effectiveTitle);
    setEditedIngredients([...effectiveIngredients]);
    setEditedInstructions([...effectiveInstructions]);
    setEditedPrepTime(effectivePrepTime || "");
    setEditedCookTime(effectiveCookTime || "");
    setEditedServings(effectiveServings || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (!savedRecipe) return;

    const updated = saveRecipeEdits(recipe.videoId, {
      title: editedTitle !== recipe.title ? editedTitle : undefined,
      ingredients: JSON.stringify(editedIngredients) !== JSON.stringify(recipe.ingredients) ? editedIngredients : undefined,
      instructions: JSON.stringify(editedInstructions) !== JSON.stringify(recipe.instructions) ? editedInstructions : undefined,
      prepTime: editedPrepTime !== recipe.prepTime ? editedPrepTime || null : undefined,
      cookTime: editedCookTime !== recipe.cookTime ? editedCookTime || null : undefined,
      servings: editedServings !== recipe.servings ? editedServings || null : undefined,
    });

    if (updated) {
      setSavedRecipe(updated);
      onUpdate?.(updated);
    }
    setIsEditing(false);
  };

  const resetEdits = () => {
    const updated = clearRecipeEdits(recipe.videoId);
    if (updated) {
      setSavedRecipe(updated);
      onUpdate?.(updated);
    }
    setIsEditing(false);
  };

  const handleTagToggle = (tag: RecipeTag) => {
    if (!savedRecipe) return;

    const hasTag = savedRecipe.tags.includes(tag);
    const updated = hasTag
      ? removeTagFromRecipe(recipe.videoId, tag)
      : addTagToRecipe(recipe.videoId, tag);

    if (updated) {
      setSavedRecipe(updated);
      onUpdate?.(updated);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !savedRecipe) return;

    const updated = addNoteToRecipe(recipe.videoId, newNote.trim());
    if (updated) {
      setSavedRecipe(updated);
      onUpdate?.(updated);
      setNewNote("");
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = removeNoteFromRecipe(recipe.videoId, noteId);
    if (updated) {
      setSavedRecipe(updated);
      onUpdate?.(updated);
    }
  };

  const toggleUnits = () => {
    setUnitSystem((prev) => (prev === "metric" ? "imperial" : "metric"));
  };

  const handleDownloadPdf = () => {
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(effectiveTitle, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 10 + 5;

      // Metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      const meta: string[] = [];
      if (effectivePrepTime) meta.push(`Prep: ${effectivePrepTime}`);
      if (effectiveCookTime) meta.push(`Cocción: ${effectiveCookTime}`);
      if (effectiveServings) meta.push(`Porciones: ${effectiveServings}`);
      if (meta.length > 0) {
        doc.text(meta.join("  •  "), margin, y);
        y += 10;
      }

      // Ingredients header
      y += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(42, 157, 143); // teal
      doc.text("INGREDIENTES", margin, y);
      y += 8;

      // Ingredients list
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      displayIngredients.forEach((ing) => {
        const line = `• ${ing.amount} ${ing.item}`;
        const lines = doc.splitTextToSize(line, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 6;

        if (y > 270) {
          doc.addPage();
          y = margin;
        }
      });

      // Instructions header
      y += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(42, 157, 143); // teal
      doc.text("INSTRUCCIONES", margin, y);
      y += 8;

      // Instructions list
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      effectiveInstructions.forEach((inst) => {
        const line = `${inst.step}. ${inst.text}`;
        const lines = doc.splitTextToSize(line, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 6 + 2;

        if (y > 270) {
          doc.addPage();
          y = margin;
        }
      });

      // Footer with source
      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Fuente: ${recipe.youtubeUrl}`, margin, y);
      y += 5;
      doc.text("Generado con Video a Receta", margin, y);

      // Save
      const filename = effectiveTitle.replace(/[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ ]/g, "").replace(/\s+/g, "-").toLowerCase();
      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSave = () => {
    const saved = saveRecipe(recipe);
    setSavedRecipe(saved);
    setIsSaved(true);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleRemove = () => {
    removeRecipe(recipe.videoId);
    setIsSaved(false);
    setSavedRecipe(null);
    onRemove?.();
  };

  const formatRecipeAsText = () => {
    let text = `${effectiveTitle}\n\n`;

    if (effectivePrepTime || effectiveCookTime || effectiveServings) {
      if (effectivePrepTime) text += `${t("prepTime")} ${effectivePrepTime}\n`;
      if (effectiveCookTime) text += `${t("cookTime")} ${effectiveCookTime}\n`;
      if (effectiveServings) text += `${t("servings")} ${effectiveServings}\n`;
      text += "\n";
    }

    text += `${t("ingredients").toUpperCase()}\n`;
    displayIngredients.forEach((ing) => {
      text += `• ${ing.amount} ${ing.item}\n`;
    });
    text += "\n";

    text += `${t("instructions").toUpperCase()}\n`;
    effectiveInstructions.forEach((inst) => {
      text += `${inst.step}. ${inst.text}\n`;
    });

    text += `\n${t("source")} ${recipe.youtubeUrl}`;

    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatRecipeAsText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToShoppingList = () => {
    addIngredientsToShoppingList(
      effectiveIngredients,
      recipe.videoId,
      effectiveTitle,
      scaleFactor
    );
    setAddedToList(true);
    setTimeout(() => setAddedToList(false), 2000);
  };

  const updateIngredient = (index: number, field: "amount" | "item", value: string) => {
    const updated = [...editedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setEditedIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setEditedIngredients(editedIngredients.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    setEditedIngredients([...editedIngredients, { amount: "", item: "" }]);
  };

  const updateInstruction = (index: number, text: string) => {
    const updated = [...editedInstructions];
    updated[index] = { ...updated[index], text };
    setEditedInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    // Re-number steps
    const filtered = editedInstructions.filter((_, i) => i !== index);
    setEditedInstructions(filtered.map((inst, i) => ({ ...inst, step: i + 1 })));
  };

  const addInstruction = () => {
    setEditedInstructions([
      ...editedInstructions,
      { step: editedInstructions.length + 1, text: "" },
    ]);
  };

  return (
    <div className="recipe-card-index w-full max-w-2xl mx-auto p-8 pl-10">
      {/* Top line */}
      <div className="recipe-top-line" />

      {/* Lined paper background */}
      <div className="recipe-card-lines" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-4 mb-1">
          {isEditing ? (
            <div className="mb-2">
              <span className="text-xs text-[var(--gold)] font-medium">{t("editingRecipe")}</span>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full font-serif text-2xl font-semibold text-[var(--text-dark)] bg-transparent border-b-2 border-[var(--teal)] focus:outline-none"
              />
            </div>
          ) : (
            <h2 className="font-serif text-2xl font-semibold text-[var(--text-dark)]">
              {effectiveTitle}
            </h2>
          )}
        </div>

        {/* Creator tag + Tags row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {recipe.creatorUsername && (
            <a
              href={recipe.creatorUrl || recipe.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--cream-dark)] text-[var(--text-muted)] hover:text-[var(--teal)] hover:bg-[var(--cream)] transition-colors"
            >
              {recipe.platform === "tiktok" && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              )}
              {recipe.platform === "youtube" && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              )}
              @{recipe.creatorUsername}
            </a>
          )}

          {savedRecipe ? (
            <TagPicker
              selectedTags={savedRecipe.tags}
              onTagToggle={handleTagToggle}
              showAddButton={!isEditing}
            />
          ) : recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--cream-dark)] text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {savedRecipe && !isEditing && (
            <CollectionPicker
              recipeId={recipe.videoId}
              selectedCollectionIds={savedRecipe.collectionIds || []}
              onUpdate={(collectionIds) => {
                const updated = { ...savedRecipe, collectionIds };
                setSavedRecipe(updated);
                onUpdate?.(updated);
              }}
            />
          )}
        </div>

        {/* Collection badges */}
        {savedRecipe?.collectionIds && savedRecipe.collectionIds.length > 0 && !isEditing && (
          <div className="mb-3">
            <CollectionBadges collectionIds={savedRecipe.collectionIds} />
          </div>
        )}

        {/* Metadata row */}
        {isEditing ? (
          <div className="grid grid-cols-3 gap-2 text-sm mb-6">
            <div>
              <label className="text-xs text-[var(--text-muted)]">{t("prepTime")}</label>
              <input
                type="text"
                value={editedPrepTime}
                onChange={(e) => setEditedPrepTime(e.target.value)}
                placeholder="15 min"
                className="w-full px-2 py-1 text-sm border border-[var(--border-warm)] rounded bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)]">{t("cookTime")}</label>
              <input
                type="text"
                value={editedCookTime}
                onChange={(e) => setEditedCookTime(e.target.value)}
                placeholder="30 min"
                className="w-full px-2 py-1 text-sm border border-[var(--border-warm)] rounded bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)]">{t("servings")}</label>
              <input
                type="text"
                value={editedServings}
                onChange={(e) => setEditedServings(e.target.value)}
                placeholder="4"
                className="w-full px-2 py-1 text-sm border border-[var(--border-warm)] rounded bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)] mb-6">
            {effectivePrepTime && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                {t("prepTime")} {effectivePrepTime}
              </span>
            )}
            {effectiveCookTime && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                {t("cookTime")} {effectiveCookTime}
              </span>
            )}
            {effectiveServings && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/>
                </svg>
                <ServingsScaler
                  originalServings={effectiveServings}
                  scaleFactor={scaleFactor}
                  onScaleChange={setScaleFactor}
                />
              </span>
            )}
          </div>
        )}

        {/* Ingredients */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)] flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              {t("ingredients")}
            </h3>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleUnits}
                className="text-xs h-7 px-2 border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
              >
                {unitSystem === "metric" ? t("imperial") : t("metric")}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              {editedIngredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                    placeholder="2 cups"
                    className="w-24 px-2 py-1 text-sm border border-[var(--border-warm)] rounded bg-white"
                  />
                  <input
                    type="text"
                    value={ing.item}
                    onChange={(e) => updateIngredient(idx, "item", e.target.value)}
                    placeholder="flour"
                    className="flex-1 px-2 py-1 text-sm border border-[var(--border-warm)] rounded bg-white"
                  />
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={addIngredient}
                className="text-sm text-[var(--teal)] hover:underline"
              >
                + Agregar ingrediente
              </button>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {displayIngredients.map((ing, idx) => (
                <li key={idx} className="text-[15px] text-[var(--text-body)]">
                  {ing.amount && (
                    <span className="text-[var(--teal)] font-medium">{ing.amount} </span>
                  )}
                  <span>{ing.item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--teal)] flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            {t("instructions")}
          </h3>

          {isEditing ? (
            <div className="space-y-2">
              {editedInstructions.map((inst, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--teal)] text-white text-xs font-semibold flex items-center justify-center mt-1">
                    {inst.step}
                  </span>
                  <textarea
                    value={inst.text}
                    onChange={(e) => updateInstruction(idx, e.target.value)}
                    rows={2}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--border-warm)] rounded bg-white resize-none"
                  />
                  <button
                    onClick={() => removeInstruction(idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded mt-1"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={addInstruction}
                className="text-sm text-[var(--teal)] hover:underline"
              >
                + Agregar paso
              </button>
            </div>
          ) : (
            <ol className="space-y-3">
              {effectiveInstructions.map((inst) => (
                <li key={inst.step} className="flex gap-3 text-[15px] text-[var(--text-body)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--teal)] text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                    {inst.step}
                  </span>
                  <span>{inst.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Nutrition section (only when not editing) */}
        {!isEditing && (
          <NutritionDisplay
            ingredients={effectiveIngredients}
            servings={effectiveServings}
            scaleFactor={scaleFactor}
          />
        )}

        {/* Notes section (only for saved recipes) */}
        {savedRecipe && !isEditing && (
          <div className="mb-6 pt-4 border-t border-[var(--border-warm)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)] flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t("notes")}
            </h3>

            {savedRecipe.notes.length > 0 && (
              <div className="space-y-2 mb-3">
                {savedRecipe.notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 p-2 bg-[var(--cream)] rounded text-sm"
                  >
                    <span className="flex-1 text-[var(--text-body)]">{note.text}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-red-500"
                    >
                      {t("deleteNote")}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder={t("notePlaceholder")}
                className="flex-1 px-3 py-2 text-sm border border-[var(--border-warm)] rounded bg-white placeholder:text-[var(--text-muted)]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
              >
                {t("addNote")}
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-warm)]">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={saveEditing}
                className="bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white"
              >
                {t("saveChanges")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
              >
                {t("cancelEdit")}
              </Button>
              {savedRecipe?.userEdits && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetEdits}
                  className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)] text-[var(--text-muted)]"
                >
                  {t("resetChanges")}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
              >
                {copied ? t("copied") : t("copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
                className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
              >
                {generatingPdf ? t("downloading") : t("downloadPdf")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToShoppingList}
                className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
              >
                {addedToList ? "+" : t("addToShoppingList")}
              </Button>
              {savedRecipe && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
                >
                  {t("edit")}
                </Button>
              )}
              {showRemove ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  className="border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
                >
                  {t("remove")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaved && !justSaved}
                  className={isSaved
                    ? "bg-[var(--cream-dark)] text-[var(--text-muted)] border border-[var(--border-warm)]"
                    : "bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white"
                  }
                >
                  {justSaved ? t("saved") : isSaved ? t("saved") : t("save")}
                </Button>
              )}
              <a
                href={recipe.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-sm text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors flex items-center gap-1"
              >
                {recipe.platform === "blog" ? t("viewSource") : t("watchVideo")}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/translations";

interface ServingsScalerProps {
  originalServings: string | null;
  scaleFactor: number;
  onScaleChange: (factor: number) => void;
}

export function ServingsScaler({
  originalServings,
  scaleFactor,
  onScaleChange,
}: ServingsScalerProps) {
  // Parse original servings to get a number
  const parseServings = (servings: string | null): number | null => {
    if (!servings) return null;
    const match = servings.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const originalCount = parseServings(originalServings);
  const [customServings, setCustomServings] = useState<string>(
    originalCount ? (originalCount * scaleFactor).toString() : ""
  );

  if (!originalCount) {
    return null;
  }

  const currentServings = Math.round(originalCount * scaleFactor);

  const handleServingsChange = (value: string) => {
    setCustomServings(value);
    const parsed = parseInt(value);
    if (parsed > 0 && originalCount) {
      onScaleChange(parsed / originalCount);
    }
  };

  const handleReset = () => {
    setCustomServings(originalCount.toString());
    onScaleChange(1);
  };

  const isScaled = Math.abs(scaleFactor - 1) > 0.001;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--text-muted)]">{t("servingsFor")}</span>
      <input
        type="number"
        min="1"
        max="99"
        value={customServings || currentServings}
        onChange={(e) => handleServingsChange(e.target.value)}
        className="w-14 px-2 py-1 text-sm text-center border border-[var(--border-warm)] rounded bg-white focus:outline-none focus:border-[var(--teal)]"
      />
      <span className="text-sm text-[var(--text-muted)]">{t("people")}</span>
      {isScaled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs h-7 px-2 text-[var(--teal)] hover:bg-[var(--cream-dark)]"
        >
          {t("resetScale")}
        </Button>
      )}
    </div>
  );
}

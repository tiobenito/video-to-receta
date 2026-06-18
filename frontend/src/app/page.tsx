"use client";

import { RecipeConverter } from "@/components/recipe-converter";
import { Header } from "@/components/header";
import { useLanguage } from "@/lib/language-context";

export default function Home() {
  const { t, locale } = useLanguage();
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Top stripe */}
      <div className="page-stripe" />

      {/* Navigation */}
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--text-dark)]">
            {locale === "en" ? (
              <>Video <span className="text-[var(--teal)]">to</span> Recipe</>
            ) : (
              <>Video <span className="text-[var(--teal)]">a</span> Receta</>
            )}
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-md mx-auto">
            {t("description")}
          </p>
        </div>

        {/* Converter */}
        <RecipeConverter />

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-[var(--text-muted)]">
          <p>{t("footer")}</p>
        </footer>
      </main>
    </div>
  );
}

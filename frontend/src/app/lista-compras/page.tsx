"use client";

import { ShoppingList } from "@/components/shopping-list";
import { Header } from "@/components/header";
import { t } from "@/lib/translations";

export default function ListaComprasPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Top stripe */}
      <div className="page-stripe" />

      {/* Navigation */}
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--text-dark)]">
            {t("shoppingList")}
          </h1>
        </div>

        <ShoppingList />

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-[var(--text-muted)]">
          <p>{t("footer")}</p>
        </footer>
      </main>
    </div>
  );
}

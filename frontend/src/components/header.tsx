"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";

export function Header() {
  const pathname = usePathname();
  const { t, locale, toggle } = useLanguage();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center bg-[var(--card-white)] rounded-xl px-6 py-4 shadow-sm">
        <Link
          href="/"
          className="font-serif text-xl font-semibold text-[var(--text-dark)]"
        >
          Video <span className="text-[var(--teal)]">{locale === "en" ? "to" : "a"}</span> {locale === "en" ? "Recipe" : "Receta"}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              isActive("/")
                ? "text-[var(--teal)]"
                : "text-[var(--text-muted)] hover:text-[var(--teal)]"
            }`}
          >
            {t("navConvert")}
          </Link>
          <Link
            href="/recetario"
            className={`text-sm font-medium transition-colors ${
              isActive("/recetario")
                ? "text-[var(--teal)]"
                : "text-[var(--text-muted)] hover:text-[var(--teal)]"
            }`}
          >
            {t("navRecipeBook")}
          </Link>
          <Link
            href="/lista-compras"
            className={`text-sm font-medium transition-colors ${
              isActive("/lista-compras")
                ? "text-[var(--teal)]"
                : "text-[var(--text-muted)] hover:text-[var(--teal)]"
            }`}
          >
            {t("shoppingList")}
          </Link>

          {/* Language toggle — dual pill */}
          <div className="flex items-center rounded-md border border-[var(--border-warm)] overflow-hidden">
            <button
              onClick={() => locale !== "en" && toggle()}
              className={`text-sm font-semibold px-2.5 py-1 transition-colors ${
                locale === "en"
                  ? "bg-[var(--teal)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--teal)]"
              }`}
            >
              EN
            </button>
            <div className="w-px h-4 bg-[var(--border-warm)]" />
            <button
              onClick={() => locale !== "es" && toggle()}
              className={`text-sm font-semibold px-2.5 py-1 transition-colors ${
                locale === "es"
                  ? "bg-[var(--teal)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--teal)]"
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

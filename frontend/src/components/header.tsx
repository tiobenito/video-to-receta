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
          Video <span className="text-[var(--teal)]">a</span> Receta
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
            Convertir
          </Link>
          <Link
            href="/recetario"
            className={`text-sm font-medium transition-colors ${
              isActive("/recetario")
                ? "text-[var(--teal)]"
                : "text-[var(--text-muted)] hover:text-[var(--teal)]"
            }`}
          >
            Recetario
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

          <button
            onClick={toggle}
            className="text-sm font-medium px-2.5 py-1 rounded-md border border-[var(--border-warm)] text-[var(--text-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors"
          >
            {locale === "en" ? "ES" : "EN"}
          </button>
        </div>
      </div>
    </nav>
  );
}

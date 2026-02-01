"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";
import { t } from "@/lib/translations";

export function Header() {
  const pathname = usePathname();

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
          <div className="ml-2 pl-4 border-l border-[var(--border-warm)]">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, logout } from "@/lib/auth-client";

export function UserMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--cream-dark)] animate-pulse" />
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="text-sm text-[var(--teal)] hover:text-[var(--teal-dark)] font-medium transition-colors"
      >
        Iniciar sesion
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || "Usuario"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--teal)] flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0) || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--card-white)] rounded-lg shadow-lg border border-[var(--border-warm)] py-1 z-50">
          <div className="px-4 py-2 border-b border-[var(--border-warm)]">
            <p className="text-sm font-medium text-[var(--text-dark)] truncate">
              {user?.name}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={async () => {
              await logout();
              setIsOpen(false);
              router.push("/");
            }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--text-body)] hover:bg-[var(--cream)] transition-colors"
          >
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}

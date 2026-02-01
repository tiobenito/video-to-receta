"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, devLogin, googleLogin } from "@/lib/auth-client";

export default function LoginPage() {
  const { isAuthenticated, isLoading, isLocalhost } = useAuth();
  const router = useRouter();

  // Auto-login on localhost
  useEffect(() => {
    if (isLocalhost && !isAuthenticated && !isLoading) {
      devLogin().then(() => {
        router.push("/");
      });
    }
  }, [isLocalhost, isAuthenticated, isLoading, router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (isLoading || (isLocalhost && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--teal)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">
            {isLocalhost ? "Iniciando sesion de desarrollo..." : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[var(--card-white)] rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif text-[var(--text-dark)] mb-2">
              Video a Receta
            </h1>
            <p className="text-[var(--text-muted)]">
              Inicia sesion para guardar tus recetas
            </p>
          </div>

          {/* Login buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => googleLogin()}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center justify-center gap-3 py-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-warm)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--card-white)] text-[var(--text-muted)]">
                o
              </span>
            </div>
          </div>

          {/* Continue without login */}
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full border-[var(--border-warm)] text-[var(--text-muted)] hover:bg-[var(--cream)]"
          >
            Continuar sin cuenta
          </Button>

          <p className="text-xs text-center text-[var(--text-muted)] mt-6">
            Tus recetas se guardaran localmente en este dispositivo.
            <br />
            Inicia sesion para sincronizar entre dispositivos.
          </p>
        </div>
      </div>
    </div>
  );
}

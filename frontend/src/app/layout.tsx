import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { LanguageProvider } from "@/lib/language-context";
import "./globals.css";

const inter = DM_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = DM_Serif_Display({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Video a Receta - Convierte Videos de Cocina en Recetas",
  description:
    "Convierte videos de cocina de YouTube, TikTok e Instagram en recetas estructuradas con ingredientes y pasos. Gratis y sin registro.",
  keywords: [
    "convertir video a receta",
    "video de TikTok a receta",
    "extraer receta de video",
    "video de cocina a texto",
    "receta de video de YouTube",
    "video a receta",
  ],
  openGraph: {
    title: "Video a Receta - Convierte Videos de Cocina en Recetas",
    description:
      "Convierte videos de cocina de YouTube en recetas estructuradas con ingredientes y pasos.",
    type: "website",
    locale: "es_MX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${lora.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

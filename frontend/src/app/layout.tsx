import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

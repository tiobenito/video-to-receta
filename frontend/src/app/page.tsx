import { RecipeConverter } from "@/components/recipe-converter";
import { t } from "@/lib/translations";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {t("description")}
          </p>
        </div>

        {/* Converter */}
        <RecipeConverter />

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>{t("footer")}</p>
        </footer>
      </main>
    </div>
  );
}

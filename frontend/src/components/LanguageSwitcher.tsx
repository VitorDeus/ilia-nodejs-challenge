import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "pt-BR", label: "PT" },
] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-1">
      {LANGS.map((lang) => (
        <Button
          key={lang.code}
          variant={i18n.language === lang.code ? "default" : "ghost"}
          size="sm"
          onClick={() => i18n.changeLanguage(lang.code)}
          className="px-2 text-xs"
        >
          {lang.label}
        </Button>
      ))}
    </div>
  );
}

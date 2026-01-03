import { cn } from "@/lib/utils";

interface LanguageFlagsProps {
  value: string;
  onChange: (value: string) => void;
}

const flagLanguages = [
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "es", flag: "🇪🇸", name: "Spanish" },
  { code: "de", flag: "🇩🇪", name: "German" },
  { code: "ru", flag: "🇷🇺", name: "Russian" },
  { code: "fr", flag: "🇫🇷", name: "French" },
];

export function LanguageFlags({ value, onChange }: LanguageFlagsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {flagLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={cn(
            "w-12 h-12 text-2xl rounded-lg transition-all duration-200 flex items-center justify-center",
            value === lang.code
              ? "bg-foreground/10 ring-2 ring-foreground/20 scale-110"
              : "hover:bg-foreground/5 hover:scale-105"
          )}
          title={lang.name}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
}

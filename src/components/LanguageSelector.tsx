import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages } from "@/lib/languages";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const selectedLang = languages.find((l) => l.code === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto gap-2 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <SelectValue>
          {selectedLang?.nativeName || "English"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <ScrollArea className="h-[300px]">
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.nativeName}</span>
                <span className="text-muted-foreground text-sm">
                  ({lang.name})
                </span>
              </span>
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}

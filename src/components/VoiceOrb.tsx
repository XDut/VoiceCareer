import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  className?: string;
}

export function VoiceOrb({ isActive, isListening, isSpeaking, className }: VoiceOrbProps) {
  return (
    <div className={cn("relative flex items-center justify-center w-16 h-16", className)}>
      {/* Outer glow rings */}
      <div
        className={cn(
          "absolute w-20 h-20 rounded-full bg-gradient-to-r from-orb-primary/20 via-orb-secondary/20 to-orb-accent/20 blur-lg transition-all duration-500",
          isActive && "animate-pulse-glow scale-110"
        )}
      />
      <div
        className={cn(
          "absolute w-18 h-18 rounded-full bg-gradient-to-r from-orb-primary/30 via-orb-secondary/30 to-orb-accent/30 blur-md transition-all duration-300",
          isActive && "animate-pulse-glow animation-delay-100 scale-105"
        )}
      />
      
      {/* Main orb */}
      <div
        className={cn(
          "relative w-14 h-14 rounded-full bg-gradient-orb shadow-xl transition-all duration-300 flex items-center justify-center overflow-hidden",
          isActive && "animate-orb-float",
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/30 before:via-transparent before:to-transparent"
        )}
        style={{
          boxShadow: isActive
            ? "0 0 30px rgba(99, 102, 241, 0.5), 0 0 50px rgba(139, 92, 246, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.2)"
            : "0 0 15px rgba(99, 102, 241, 0.3), 0 0 25px rgba(139, 92, 246, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Inner content */}
        <div className="relative z-10 flex items-center justify-center">
          {isListening ? (
            <VoiceWaves />
          ) : isSpeaking ? (
            <SpeakingWaves />
          ) : (
            <MicIcon />
          )}
        </div>
      </div>
    </div>
  );
}

function VoiceWaves() {
  return (
    <div className="flex items-end justify-center gap-0.5 h-5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="voice-wave-bar animate-wave w-0.5"
          style={{
            height: "100%",
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.5 + Math.random() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function SpeakingWaves() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6 text-primary-foreground/90"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

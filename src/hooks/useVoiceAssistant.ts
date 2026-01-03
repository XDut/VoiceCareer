import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const TRANSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`;
const SPEAK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-speak`;

interface UseVoiceAssistantReturn {
  isTranscribing: boolean;
  isSpeaking: boolean;
  transcribe: (audioBlob: Blob, languageCode: string) => Promise<string | null>;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const transcribe = useCallback(
    async (audioBlob: Blob, languageCode: string): Promise<string | null> => {
      setIsTranscribing(true);
      
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", languageCode);

        const response = await fetch(TRANSCRIBE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Transcription failed");
        }

        const data = await response.json();
        console.log("Transcribed:", data.text);
        return data.text;
      } catch (error) {
        console.error("Transcription error:", error);
        toast({
          variant: "destructive",
          title: "Transcription Error",
          description: (error as Error).message || "Could not transcribe audio",
        });
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [toast]
  );

  const speak = useCallback(
    async (text: string): Promise<void> => {
      const normalized = text.trim();
      if (!normalized) return;

      // Prevent very long responses from exceeding TTS quota.
      // (We keep chat content intact; only the spoken audio is shortened.)
      const MAX_SPOKEN_CHARS = 800;
      const spokenText =
        normalized.length > MAX_SPOKEN_CHARS
          ? `${normalized.slice(0, MAX_SPOKEN_CHARS)}…`
          : normalized;

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsSpeaking(true);

      try {
        const response = await fetch(SPEAK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: spokenText }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Speech generation failed");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
      } catch (error) {
        setIsSpeaking(false);
        console.error("Speech error:", error);
        toast({
          variant: "destructive",
          title: "Speech Error",
          description: (error as Error).message || "Could not generate speech",
        });
      }
    },
    [toast]
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return {
    isTranscribing,
    isSpeaking,
    transcribe,
    speak,
    stopSpeaking,
  };
}

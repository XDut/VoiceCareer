import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

        const { data, error } = await supabase.functions.invoke("voice-transcribe", {
          body: formData,
        });

        if (error) {
          throw new Error(error.message || "Transcription failed");
        }

        console.log("Transcribed:", data?.text);
        return data?.text || null;
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
        // For binary responses, we use the Supabase client's URL and session
        // but need to fetch directly since functions.invoke() parses JSON by default
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        // Use the client's URL property and session for authentication
        const functionUrl = `${supabase.supabaseUrl}/functions/v1/voice-speak`;
        const fetchResponse = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ text: spokenText }),
        });

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Speech generation failed");
        }

        const audioBlob = await fetchResponse.blob();
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

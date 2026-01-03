import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseCareerChatReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, language: string) => Promise<string | null>;
  clearMessages: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;

export function useCareerChat(): UseCareerChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, language: string): Promise<string | null> => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      let assistantContent = "";

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            language,
          }),
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Request failed: ${response.status}`);
        }

        const assistantContent = data.message || "I'm sorry, I couldn't generate a response.";
        const assistantId = crypto.randomUUID();
        
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: assistantContent },
        ]);

        setIsLoading(false);
        return assistantContent;
      } catch (error) {
        setIsLoading(false);
        if ((error as Error).name === "AbortError") {
          return null;
        }
        console.error("Chat error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message || "Failed to get response",
        });
        return null;
      }
    },
    [messages, toast]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}

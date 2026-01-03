import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

        const { data, error } = await supabase.functions.invoke("career-chat", {
          body: {
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            language,
          },
        });

        if (error) {
          throw new Error(error.message || "Request failed");
        }

        const assistantContent = data?.message || "I'm sorry, I couldn't generate a response.";
        const assistantId = crypto.randomUUID();
        
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: assistantContent },
        ]);

        setIsLoading(false);
        return assistantContent;
      } catch (error) {
        setIsLoading(false);
        // Note: Supabase client doesn't support AbortController directly
        // Cancellation would need to be handled differently if needed
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
    // Note: AbortController is no longer used with Supabase client
    abortControllerRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}

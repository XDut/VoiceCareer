import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-accent text-accent-foreground rounded-tr-md"
            : "glass-card rounded-tl-md"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isLatest && !isUser && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-accent animate-pulse rounded-sm" />
          )}
        </p>
      </div>
    </div>
  );
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          isLatest={isLoading && index === messages.length - 1}
        />
      ))}
    </div>
  );
}

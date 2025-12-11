import { useEffect, useRef } from "react";
import { Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  messages: Message[];
  isThinking?: boolean;
}

export function ChatArea({ messages, isThinking }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);
  
  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">
              No messages yet
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Connect to the SOC to start
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isThinking && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-team-officer/10 text-team-officer border-team-officer/30">
                <div className="w-2 h-2 rounded-full bg-team-officer animate-pulse" />
              </div>
              <div className="flex items-center gap-1 px-4 py-2.5 bg-background-tertiary rounded-xl border border-border rounded-bl-sm">
                <span className="text-xs text-muted-foreground">SOC is analyzing</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

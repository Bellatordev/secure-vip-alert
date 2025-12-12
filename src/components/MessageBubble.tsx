import { Shield, Globe, Search, Phone, User, Heart } from "lucide-react";
import { Message, Speaker } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: Message;
}

const speakerInfo: Record<Speaker, { name: string; icon: React.ReactNode; colorClass: string }> = {
  user: {
    name: "You",
    icon: <User className="w-4 h-4" />,
    colorClass: "bg-primary/20 text-primary border-primary/30",
  },
  clientOfficer: {
    name: "Client Officer",
    icon: <User className="w-4 h-4" />,
    colorClass: "bg-team-officer/10 text-team-officer border-team-officer/30",
  },
  security: {
    name: "Security",
    icon: <Shield className="w-4 h-4" />,
    colorClass: "bg-team-security/10 text-team-security border-team-security/30",
  },
  travel: {
    name: "Travel Expert",
    icon: <Globe className="w-4 h-4" />,
    colorClass: "bg-team-travel/10 text-team-travel border-team-travel/30",
  },
  researcher: {
    name: "Researcher",
    icon: <Search className="w-4 h-4" />,
    colorClass: "bg-team-researcher/10 text-team-researcher border-team-researcher/30",
  },
  contacts: {
    name: "Contact Agent",
    icon: <Phone className="w-4 h-4" />,
    colorClass: "bg-team-contacts/10 text-team-contacts border-team-contacts/30",
  },
  medical: {
    name: "Medical",
    icon: <Heart className="w-4 h-4" />,
    colorClass: "bg-team-medical/10 text-team-medical border-team-medical/30",
  },
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.speaker === 'user';
  const info = speakerInfo[message.speaker];
  
  return (
    <div className={cn(
      "flex gap-3 animate-fade-in",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
        info.colorClass
      )}>
        {info.icon}
      </div>
      
      {/* Message content */}
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-xs font-medium",
            isUser ? "text-primary" : "text-muted-foreground"
          )}>
            {info.name}
          </span>
          <span className="text-xs font-mono text-muted-foreground/60">
            {format(new Date(message.timestamp), "HH:mm")}
          </span>
        </div>
        
        <div className={cn(
          "rounded-xl px-4 py-2.5 text-sm leading-relaxed",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-background-tertiary text-foreground border border-border rounded-bl-sm"
        )}>
          {message.content}
        </div>
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={attachment.thumbnailUrl || attachment.url}
                  alt={attachment.filename}
                  className="w-32 h-32 object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

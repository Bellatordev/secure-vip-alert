import { Shield, Globe, Search, Phone, User } from "lucide-react";
import { TeamMember, TeamMemberStatus } from "@/types";
import { cn } from "@/lib/utils";

interface TeamPanelProps {
  teamMembers: TeamMember[];
  activeSpeaker: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  clientOfficer: <User className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  travel: <Globe className="w-4 h-4" />,
  researcher: <Search className="w-4 h-4" />,
  contacts: <Phone className="w-4 h-4" />,
};

const colorMap: Record<string, string> = {
  clientOfficer: "text-team-officer bg-team-officer/10 border-team-officer/30",
  security: "text-team-security bg-team-security/10 border-team-security/30",
  travel: "text-team-travel bg-team-travel/10 border-team-travel/30",
  researcher: "text-team-researcher bg-team-researcher/10 border-team-researcher/30",
  contacts: "text-team-contacts bg-team-contacts/10 border-team-contacts/30",
};

const statusColors: Record<TeamMemberStatus, string> = {
  idle: "bg-muted-foreground/30",
  tasked: "bg-warning",
  active: "bg-success",
  speaking: "bg-primary pulse-live",
};

export function TeamPanel({ teamMembers, activeSpeaker }: TeamPanelProps) {
  return (
    <div className="bg-background-secondary rounded-xl border border-border p-3 shadow-panel">
      <h3 className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
        SOC Team
      </h3>
      
      <div className="space-y-1.5">
        {teamMembers.map((member) => {
          const isActive = member.status === 'active' || member.status === 'speaking';
          const isSpeaking = activeSpeaker === member.id;
          
          return (
            <div
              key={member.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                isActive ? "bg-background-tertiary" : "opacity-60 hover:opacity-80"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                colorMap[member.id],
                isActive && "shadow-sm"
              )}>
                {iconMap[member.id]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {member.name}
                  </span>
                  
                  {isSpeaking && (
                    <div className="speaking-wave flex items-end h-4">
                      <span /><span /><span /><span /><span />
                    </div>
                  )}
                </div>
                
                <span className="text-xs text-muted-foreground truncate block">
                  {member.role}
                </span>
              </div>
              
              <div className={cn(
                "w-2 h-2 rounded-full transition-all",
                statusColors[member.status]
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

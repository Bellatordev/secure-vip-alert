import { Lock, Globe, Users } from "lucide-react";
import { ConnectButton } from "./ConnectButton";
import { SOSButton } from "./SOSButton";
import { ConnectionStatus } from "@/types";
import dangerRoomLogo from "@/assets/danger-room-logo.png";

interface WelcomeScreenProps {
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onSOS: () => void;
}

export function WelcomeScreen({ connectionStatus, onConnect, onSOS }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-8 animate-fade-in">
        <img 
          src={dangerRoomLogo} 
          alt="DANGER ROOM" 
          className="w-24 h-24 mx-auto mb-6 object-contain drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]"
        />
        
        <h1 className="font-display text-3xl font-bold text-foreground mb-3 tracking-wide">
          DANGER ROOM
        </h1>
        
        <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Your personal Security Operations Center. Expert security guidance on demand.
        </p>
      </div>
      
      {/* Features */}
      <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-secondary border border-border">
          <Lock className="w-5 h-5 text-team-security" />
          <span className="text-xs text-muted-foreground text-center">Security</span>
        </div>
        
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-secondary border border-border">
          <Globe className="w-5 h-5 text-team-travel" />
          <span className="text-xs text-muted-foreground text-center">Travel Intel</span>
        </div>
        
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-secondary border border-border">
          <Users className="w-5 h-5 text-team-officer" />
          <span className="text-xs text-muted-foreground text-center">Expert Team</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="w-full max-w-sm space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <SOSButton onActivate={onSOS} />
        
        <div className="relative flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        
        <ConnectButton 
          status={connectionStatus}
          onConnect={onConnect}
          onDisconnect={() => {}}
        />
      </div>
      
      {/* Trust badge */}
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/60 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <Lock className="w-3 h-3" />
        <span>End-to-end encrypted • Secure connection</span>
      </div>
    </div>
  );
}
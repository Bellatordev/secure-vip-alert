import { Shield, Settings } from "lucide-react";
import { ConnectionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  connectionStatus: ConnectionStatus;
}

export function Header({ connectionStatus }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background-secondary/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-foreground">
          SOC ROOM
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <div className="w-2 h-2 rounded-full bg-success pulse-live" />
            <span className="text-xs font-mono font-medium text-success uppercase tracking-wider">
              Live
            </span>
          </div>
        )}
        
        {connectionStatus === 'connecting' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-mono font-medium text-warning uppercase tracking-wider">
              Connecting
            </span>
          </div>
        )}
        
        <button 
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

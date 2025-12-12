import { ConnectionStatus } from "@/types";
import { SettingsPanel } from "./SettingsPanel";
import dangerRoomLogo from "@/assets/danger-room-logo.png";

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export function Header({
  connectionStatus,
  selectedVoice,
  onVoiceChange,
  volume,
  onVolumeChange,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background-secondary/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2">
        <img 
          src={dangerRoomLogo} 
          alt="DANGER ROOM" 
          className="w-9 h-9 object-contain"
        />
        <span className="font-display font-bold text-lg tracking-tight text-foreground">
          DANGER ROOM
        </span>
      </div>

      <div className="flex items-center gap-3">
        {connectionStatus === "connected" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <div className="w-2 h-2 rounded-full bg-success pulse-live" />
            <span className="text-xs font-mono font-medium text-success uppercase tracking-wider">
              Live
            </span>
          </div>
        )}

        {connectionStatus === "connecting" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-mono font-medium text-warning uppercase tracking-wider">
              Connecting
            </span>
          </div>
        )}

        <SettingsPanel
          selectedVoice={selectedVoice}
          onVoiceChange={onVoiceChange}
          volume={volume}
          onVolumeChange={onVolumeChange}
        />
      </div>
    </header>
  );
}
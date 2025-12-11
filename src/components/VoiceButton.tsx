import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { VoiceState, VoiceMode } from "@/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  voiceState: VoiceState;
  voiceMode: VoiceMode;
  onPress: () => void;
  onRelease?: () => void;
  disabled?: boolean;
}

const stateLabels: Record<VoiceState, string> = {
  idle: "Tap to Talk",
  recording: "Listening...",
  transcribing: "Processing...",
  thinking: "Analyzing...",
  speaking: "Speaking...",
};

export function VoiceButton({ 
  voiceState, 
  voiceMode, 
  onPress, 
  onRelease,
  disabled 
}: VoiceButtonProps) {
  const isRecording = voiceState === 'recording';
  const isProcessing = voiceState === 'transcribing' || voiceState === 'thinking';
  const isSpeaking = voiceState === 'speaking';
  const isIdle = voiceState === 'idle';
  
  const handlePointerDown = () => {
    if (voiceMode === 'push-to-talk' && isIdle) {
      onPress();
    }
  };
  
  const handlePointerUp = () => {
    if (voiceMode === 'push-to-talk' && isRecording && onRelease) {
      onRelease();
    }
  };
  
  const handleClick = () => {
    if (voiceMode === 'vad') {
      onPress();
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="tactical"
        size="icon-xl"
        className={cn(
          "rounded-full relative transition-all duration-300",
          isRecording && "bg-destructive/10 border-destructive pulse-record",
          isSpeaking && "bg-primary/10 border-primary",
          isProcessing && "opacity-70"
        )}
        disabled={disabled || isProcessing}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      >
        {isRecording ? (
          <MicOff className="w-8 h-8 text-destructive" />
        ) : isSpeaking ? (
          <Volume2 className="w-8 h-8 text-primary" />
        ) : isProcessing ? (
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        ) : (
          <Mic className="w-8 h-8 text-foreground" />
        )}
        
        {/* Recording ring animation */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full border-2 border-destructive animate-ping" />
        )}
      </Button>
      
      <span className={cn(
        "text-xs font-medium transition-colors",
        isRecording ? "text-destructive" : 
        isSpeaking ? "text-primary" : 
        "text-muted-foreground"
      )}>
        {stateLabels[voiceState]}
      </span>
    </div>
  );
}

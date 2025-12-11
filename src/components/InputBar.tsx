import { useState } from "react";
import { Send, ToggleLeft, ToggleRight } from "lucide-react";
import { VoiceState, VoiceMode } from "@/types";
import { VoiceButton } from "./VoiceButton";
import { ImageUpload } from "./ImageUpload";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface InputBarProps {
  voiceState: VoiceState;
  voiceMode: VoiceMode;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  onVoiceModeToggle: () => void;
  onImageUpload: (file: File) => Promise<void>;
  onTextSubmit: (text: string) => void;
  disabled?: boolean;
}

export function InputBar({
  voiceState,
  voiceMode,
  onVoiceStart,
  onVoiceStop,
  onVoiceModeToggle,
  onImageUpload,
  onTextSubmit,
  disabled,
}: InputBarProps) {
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onTextSubmit(textInput.trim());
      setTextInput("");
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background-secondary/95 backdrop-blur-md border-t border-border p-4 safe-area-pb">
      {/* Voice mode toggle */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={onVoiceModeToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-tertiary text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {voiceMode === 'push-to-talk' ? (
            <>
              <ToggleLeft className="w-4 h-4" />
              <span>Push-to-Talk</span>
            </>
          ) : (
            <>
              <ToggleRight className="w-4 h-4 text-primary" />
              <span className="text-primary">Voice Activity</span>
            </>
          )}
        </button>
      </div>
      
      {/* Main input area */}
      <div className="flex items-end gap-3">
        <ImageUpload 
          onUpload={onImageUpload} 
          disabled={disabled} 
        />
        
        {showTextInput ? (
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 px-4 rounded-xl bg-background-tertiary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={disabled}
            />
            <Button 
              type="submit" 
              variant="gold" 
              size="icon" 
              className="h-12 w-12 rounded-xl"
              disabled={disabled || !textInput.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        ) : (
          <div className="flex-1 flex justify-center">
            <VoiceButton
              voiceState={voiceState}
              voiceMode={voiceMode}
              onPress={onVoiceStart}
              onRelease={onVoiceStop}
              disabled={disabled}
            />
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowTextInput(!showTextInput)}
          className={cn(
            "rounded-full h-10 w-10",
            showTextInput && "text-primary"
          )}
        >
          {showTextInput ? (
            <span className="text-xs font-medium">🎤</span>
          ) : (
            <span className="text-xs font-medium">⌨️</span>
          )}
        </Button>
      </div>
    </div>
  );
}

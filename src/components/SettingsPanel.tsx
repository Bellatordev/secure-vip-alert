import { useState, useEffect } from "react";
import { Settings, Volume2, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

const voiceOptions: VoiceOption[] = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and confident" },
  { id: "fable", name: "Fable", description: "Expressive storyteller" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Friendly and upbeat" },
  { id: "shimmer", name: "Shimmer", description: "Soft and calming" },
];

interface SettingsPanelProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export function SettingsPanel({
  selectedVoice,
  onVoiceChange,
  volume,
  onVolumeChange,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-background border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground font-display">Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Voice Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              AI Voice
            </Label>
            <div className="grid gap-2">
              {voiceOptions.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => onVoiceChange(voice.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                    selectedVoice === voice.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background-secondary hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        selectedVoice === voice.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {voice.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {voice.description}
                      </p>
                    </div>
                  </div>
                  {selectedVoice === voice.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Volume
            </Label>
            <div className="flex items-center gap-4">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={(values) => onVolumeChange(values[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8 text-right">
                {volume}%
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

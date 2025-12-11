import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface SOSButtonProps {
  onActivate: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export function SOSButton({ onActivate, isActive, disabled }: SOSButtonProps) {
  return (
    <Button
      variant="sos"
      size="xl"
      onClick={onActivate}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl font-display uppercase tracking-wider",
        isActive && "ring-2 ring-destructive ring-offset-2 ring-offset-background"
      )}
    >
      <AlertTriangle className="w-5 h-5" />
      <span>Emergency SOS</span>
    </Button>
  );
}

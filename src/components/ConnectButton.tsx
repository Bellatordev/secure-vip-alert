import { Radio, Power } from "lucide-react";
import { Button } from "./ui/button";
import { ConnectionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ConnectButtonProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectButton({ status, onConnect, onDisconnect }: ConnectButtonProps) {
  if (status === 'connected') {
    return (
      <Button
        variant="outline"
        size="lg"
        onClick={onDisconnect}
        className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Power className="w-5 h-5" />
        <span>Disconnect</span>
      </Button>
    );
  }
  
  return (
    <Button
      variant="connect"
      size="xl"
      onClick={onConnect}
      disabled={status === 'connecting'}
      className="w-full rounded-xl"
    >
      <Radio className={cn(
        "w-5 h-5",
        status === 'connecting' && "animate-pulse"
      )} />
      <span>
        {status === 'connecting' ? 'Connecting...' : 'Connect to SOC'}
      </span>
    </Button>
  );
}

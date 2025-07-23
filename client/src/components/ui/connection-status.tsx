import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  if (isConnected) {
    return (
      <div className="flex items-center text-green-600 dark:text-green-400">
        <Wifi size={16} className="mr-1" />
        <span className="text-xs">Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-red-600 dark:text-red-400">
      <WifiOff size={16} className="mr-1" />
      <span className="text-xs">Disconnected</span>
    </div>
  );
}
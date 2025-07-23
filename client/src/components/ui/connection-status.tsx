import { Wifi } from "lucide-react";

export function ConnectionStatus() {
  // Since WebSocket is disabled, we show online status via HTTP
  return (
    <div className="flex items-center text-green-600 dark:text-green-400">
      <Wifi size={16} className="mr-1" />
      <span className="text-xs">Online</span>
    </div>
  );
}
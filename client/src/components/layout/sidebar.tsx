import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Send, 
  Users, 
  History, 
  Calendar, 
  Settings,
  Send as TelegramIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

import { ConnectionStatus } from "@/components/ui/connection-status";
import { RealTimeClock } from "@/components/ui/real-time-clock";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Compose Message", href: "/compose", icon: Send },
  { name: "Users", href: "/users", icon: Users },
  { name: "Message History", href: "/history", icon: History },
  { name: "Scheduled Messages", href: "/scheduled", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isWebSocketConnected?: boolean;
}

export function Sidebar({ isWebSocketConnected = false }: SidebarProps) {
  const [location] = useLocation();

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/stats"],
  });

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 telegram-bg rounded-lg flex items-center justify-center">
            <TelegramIcon className="text-white text-xl" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Broadcast Bot</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "telegram-bg-light telegram-text border telegram-border bg-opacity-10"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
{item.name === "Users" && userStats && typeof userStats === 'object' && 'total' in userStats ? (
                  <Badge variant="secondary" className="ml-auto">
                    {(userStats as { total: number }).total.toLocaleString()}
                  </Badge>
                ) : null}
                {item.name === "Scheduled Messages" && (
                  <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-700 border-yellow-200">
                    3
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Admin Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <ConnectionStatus />
        </div>
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <RealTimeClock />
        </div>
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" />
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Online
            </p>
          </div>

        </div>
      </div>
    </aside>
  );
}

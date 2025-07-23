import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentBroadcasts } from "@/components/dashboard/recent-broadcasts";
import { ComposeForm } from "@/components/broadcast/compose-form";
import { MessagePreview } from "@/components/broadcast/message-preview";
import { QuickBroadcast } from "@/components/broadcast/quick-broadcast";
import { DashboardClock } from "@/components/ui/dashboard-clock";
import { HeaderClock } from "@/components/ui/header-clock";
import { 
  Bell, 
  Plus, 
  Download, 
  ClipboardList, 
  BarChart3, 
  Bot,
  RefreshCw,
  Send
} from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [previewData, setPreviewData] = useState<{ title: string; message: string } | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  const { data: recentBroadcasts, isLoading: broadcastsLoading } = useQuery({
    queryKey: ["/api/broadcasts"],
    select: (data: any) => data?.slice(0, 3) || [], // Only show 3 recent broadcasts
  });

  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/stats"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const quickActions = [
    {
      name: "Export User List",
      icon: Download,
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      onClick: () => {
        // TODO: Implement export functionality
        console.log("Export users");
      },
    },
    {
      name: "Message Templates",
      icon: ClipboardList,
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      onClick: () => {
        // TODO: Navigate to templates
        console.log("Message templates");
      },
    },
    {
      name: "View Analytics",
      icon: BarChart3,
      iconBg: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      onClick: () => {
        // TODO: Navigate to analytics
        console.log("View analytics");
      },
    },
    {
      name: "Bot Settings",
      icon: Bot,
      iconBg: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-600 dark:text-gray-400",
      onClick: () => {
        // TODO: Navigate to bot settings
        console.log("Bot settings");
      },
    },
  ];

  if (statsLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your broadcast performance and manage users</p>
          </div>
          <div className="flex items-center space-x-4">
            <HeaderClock />
            <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            <Button className="telegram-bg hover:telegram-bg-dark text-white">
              <Plus size={16} className="mr-2" />
              Quick Broadcast
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-8 space-y-8">
        {/* Stats and Clock Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {stats && typeof stats === 'object' && stats !== null && 'totalUsers' in stats ? (
              <StatsCards stats={stats as any} />
            ) : null}
          </div>
          <div>
            <DashboardClock />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Compose & Recent Broadcasts */}
          <div className="lg:col-span-2 space-y-8">
            <ComposeForm onPreview={(data) => setPreviewData(data)} />
            {recentBroadcasts && <RecentBroadcasts broadcasts={recentBroadcasts} />}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Quick Broadcast */}
            <QuickBroadcast recipientCount={(stats as any)?.totalUsers || 0} />
            {/* Bot Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Bot Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Connection</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (botStatus as any)?.isOnline ? "bg-green-500" : "bg-red-500"
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        (botStatus as any)?.isOnline ? "text-green-600" : "text-red-600"
                      }`}>
                        {(botStatus as any)?.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Activity</span>
                    <span className="text-sm text-gray-900 dark:text-white">2 minutes ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Messages/Hour</span>
                    <span className="text-sm text-gray-900 dark:text-white">1,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">API Calls</span>
                    <span className="text-sm text-gray-900 dark:text-white">12,847</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button variant="outline" size="sm" className="w-full">
                    <RefreshCw size={16} className="mr-2" />
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    
                    return (
                      <Button
                        key={action.name}
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto"
                        onClick={action.onClick}
                      >
                        <div className={`w-8 h-8 ${action.iconBg} rounded-lg flex items-center justify-center mr-3`}>
                          <Icon className={`${action.iconColor}`} size={16} />
                        </div>
                        <span className="text-sm font-medium">{action.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Live User Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Live Activity</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">📱</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Phone Registration</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Users now asked for phone numbers</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500 text-white">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🤖</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Bot Online</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ready to receive users</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">Online</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">📊</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Real-time Updates</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard refreshes automatically</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Auto</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <MessagePreview
          isOpen={!!previewData}
          onClose={() => setPreviewData(null)}
          title={previewData.title}
          message={previewData.message}
          recipientCount={(stats as any)?.totalUsers || 0}
        />
      )}
    </div>
  );
}

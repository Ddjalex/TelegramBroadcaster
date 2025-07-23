import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Shield, Bell, MessageSquare, Save } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [botToken, setBotToken] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [autoResponse, setAutoResponse] = useState(true);

  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
  });

  const saveBotTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/settings", {
        key: "bot_token",
        value: token,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Bot token updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bot token",
        variant: "destructive",
      });
    },
  });

  const saveWelcomeMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/settings", {
        key: "welcome_message",
        value: message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Welcome message updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update welcome message",
        variant: "destructive",
      });
    },
  });

  const handleSaveBotToken = () => {
    if (!botToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid bot token",
        variant: "destructive",
      });
      return;
    }
    saveBotTokenMutation.mutate(botToken);
  };

  const handleSaveWelcomeMessage = () => {
    saveWelcomeMessageMutation.mutate(welcomeMessage);
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your bot settings and preferences</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Bot Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Bot className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <CardTitle>Bot Configuration</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure your Telegram bot settings</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <div className="flex space-x-2">
                  <Input
                    id="bot-token"
                    type="password"
                    placeholder="Enter your Telegram bot token"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSaveBotToken}
                    disabled={saveBotTokenMutation.isPending}
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get your bot token from @BotFather on Telegram
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Bot Status</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      (botStatus as any)?.isOnline ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {(botStatus as any)?.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bot Username</Label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    @{(botStatus as any)?.username || "Not configured"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <CardTitle>Message Settings</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customize your bot's messages and responses</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Enter the welcome message for new users"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This message will be sent to users when they use /start
                  </p>
                  <Button 
                    size="sm"
                    onClick={handleSaveWelcomeMessage}
                    disabled={saveWelcomeMessageMutation.isPending}
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Response</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically respond to user messages
                    </p>
                  </div>
                  <Switch
                    checked={autoResponse}
                    onCheckedChange={setAutoResponse}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Bell className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure notification preferences</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive email alerts for important events
                  </p>
                </div>
                <Switch
                  checked={enableNotifications}
                  onCheckedChange={setEnableNotifications}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email address for admin notifications
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Shield className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Security and access control settings</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Admin Password</Label>
                <div className="flex space-x-2">
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter new admin password"
                    className="flex-1"
                  />
                  <Button variant="outline">
                    Update
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>API Access</Label>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Enable API Access</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow external API access to this bot</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

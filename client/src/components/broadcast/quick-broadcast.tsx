import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Users, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QuickBroadcastProps {
  recipientCount: number;
}

export function QuickBroadcast({ recipientCount }: QuickBroadcastProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quickBroadcastMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/broadcasts/quick", { message });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ 
        title: "Quick broadcast sent!", 
        description: `Message sent to ${data.recipientCount} users` 
      });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send broadcast",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (recipientCount === 0) {
      toast({
        title: "Error",
        description: "No active users to send message to",
        variant: "destructive",
      });
      return;
    }

    quickBroadcastMutation.mutate(message.trim());
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
          <Zap size={16} />
          <span className="text-sm font-medium">Quick Send</span>
        </div>
        
        <Textarea
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[80px] border-yellow-200 focus:border-yellow-300"
          disabled={quickBroadcastMutation.isPending}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
            <Users size={14} />
            <span>{recipientCount} recipients</span>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={quickBroadcastMutation.isPending || !message.trim() || recipientCount === 0}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            size="sm"
          >
            {quickBroadcastMutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send size={14} className="mr-1" />
                Send Now
              </>
            )}
          </Button>
        </div>

        {message.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {message.length}/4096 characters
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Info, MoreVertical, CheckCheck, Send } from "lucide-react";
import type { Broadcast } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface RecentBroadcastsProps {
  broadcasts: Broadcast[];
}

const statusIcons = {
  sent: CheckCircle,
  sending: Clock,
  scheduled: Clock,
  draft: Info,
  failed: Info,
};

const statusColors = {
  sent: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  sending: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
  scheduled: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
  draft: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  failed: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

export function RecentBroadcasts({ broadcasts }: RecentBroadcastsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Broadcasts</CardTitle>
          <Button variant="link" className="telegram-text">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {broadcasts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Send size={48} className="mx-auto mb-4 opacity-50" />
              <p>No broadcasts sent yet</p>
              <p className="text-sm">Create your first broadcast to get started</p>
            </div>
          ) : (
            broadcasts.map((broadcast) => {
              const StatusIcon = statusIcons[broadcast.status as keyof typeof statusIcons];
              const deliveryRate = (broadcast.totalRecipients || 0) > 0 
                ? (((broadcast.successfulDeliveries || 0) / (broadcast.totalRecipients || 1)) * 100).toFixed(1)
                : 0;
              
              return (
                <div
                  key={broadcast.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className={`w-10 h-10 ${statusColors[broadcast.status as keyof typeof statusColors]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {broadcast.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {broadcast.message.substring(0, 100)}...
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {broadcast.sentAt 
                          ? formatDistanceToNow(new Date(broadcast.sentAt), { addSuffix: true })
                          : broadcast.scheduledFor
                          ? `Scheduled for ${new Date(broadcast.scheduledFor).toLocaleDateString()}`
                          : formatDistanceToNow(new Date(broadcast.createdAt!), { addSuffix: true })
                        }
                      </span>
                      <span>{broadcast.totalRecipients || 0} recipients</span>
                      {broadcast.status === 'sent' && (
                        <span className="flex items-center text-green-500">
                          <CheckCheck size={12} className="mr-1" />
                          {deliveryRate}% delivered
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

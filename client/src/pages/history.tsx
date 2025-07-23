import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, MoreVertical, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Broadcast } from "@shared/schema";

const statusConfig = {
  sent: { 
    icon: CheckCircle, 
    color: "text-green-600 dark:text-green-400", 
    bgColor: "bg-green-100 dark:bg-green-900/20",
    label: "Sent" 
  },
  sending: { 
    icon: Clock, 
    color: "text-yellow-600 dark:text-yellow-400", 
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    label: "Sending" 
  },
  scheduled: { 
    icon: Clock, 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    label: "Scheduled" 
  },
  draft: { 
    icon: AlertCircle, 
    color: "text-gray-600 dark:text-gray-400", 
    bgColor: "bg-gray-100 dark:bg-gray-800",
    label: "Draft" 
  },
  failed: { 
    icon: AlertCircle, 
    color: "text-red-600 dark:text-red-400", 
    bgColor: "bg-red-100 dark:bg-red-900/20",
    label: "Failed" 
  },
};

export default function History() {
  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ["/api/broadcasts"],
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Message History</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View all your broadcast messages and their delivery status</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 space-y-6">
        {/* Broadcasts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Broadcasts</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search broadcasts..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {broadcasts && Array.isArray(broadcasts) && broadcasts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Delivery Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(broadcasts as Broadcast[]).map((broadcast: Broadcast) => {
                    const status = statusConfig[broadcast.status as keyof typeof statusConfig] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    const deliveryRate = (broadcast.totalRecipients || 0) > 0 
                      ? (((broadcast.successfulDeliveries || 0) / (broadcast.totalRecipients || 1)) * 100).toFixed(1)
                      : 0;
                    
                    return (
                      <TableRow key={broadcast.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{broadcast.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {broadcast.message.substring(0, 50)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 ${status.bgColor} rounded-lg flex items-center justify-center`}>
                              <StatusIcon className={status.color} size={16} />
                            </div>
                            <span className="text-sm font-medium">{status.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {broadcast.totalRecipients?.toLocaleString() || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {broadcast.status === 'sent' ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-20">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${deliveryRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-12">
                                {deliveryRate}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDistanceToNow(new Date(broadcast.createdAt!), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {broadcast.sentAt 
                              ? formatDistanceToNow(new Date(broadcast.sentAt), { addSuffix: true })
                              : '-'
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No broadcasts yet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Your broadcast history will appear here once you start sending messages
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

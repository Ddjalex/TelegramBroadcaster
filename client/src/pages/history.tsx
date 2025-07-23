import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Eye, MoreVertical, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ["/api/broadcasts"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const deleteBroadcastMutation = useMutation({
    mutationFn: async (broadcastId: number) => {
      const response = await fetch(`/api/broadcasts/${broadcastId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Broadcast deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to delete broadcast",
        variant: "destructive",
      });
    },
  });

  const handleViewBroadcast = (broadcast: Broadcast) => {
    setSelectedBroadcast(broadcast);
    setIsViewDialogOpen(true);
  };

  const handleDeleteBroadcast = (broadcastId: number) => {
    if (confirm('Are you sure you want to delete this broadcast? This action cannot be undone.')) {
      deleteBroadcastMutation.mutate(broadcastId);
    }
  };

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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewBroadcast(broadcast)}
                              title="View broadcast details"
                            >
                              <Eye size={16} />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteBroadcast(broadcast.id)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* View Broadcast Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broadcast Details</DialogTitle>
            <DialogDescription>
              View the full details of this broadcast message
            </DialogDescription>
          </DialogHeader>
          {selectedBroadcast && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedBroadcast.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedBroadcast.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <div className={`w-6 h-6 ${statusConfig[selectedBroadcast.status as keyof typeof statusConfig]?.bgColor || statusConfig.draft.bgColor} rounded-lg flex items-center justify-center`}>
                      {(() => {
                        const StatusIcon = statusConfig[selectedBroadcast.status as keyof typeof statusConfig]?.icon || statusConfig.draft.icon;
                        return <StatusIcon className={statusConfig[selectedBroadcast.status as keyof typeof statusConfig]?.color || statusConfig.draft.color} size={14} />;
                      })()}
                    </div>
                    <span className="text-sm font-medium">
                      {statusConfig[selectedBroadcast.status as keyof typeof statusConfig]?.label || 'Draft'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipients</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedBroadcast.totalRecipients?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Successful Deliveries</label>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400 font-medium">
                    {selectedBroadcast.successfulDeliveries?.toLocaleString() || 0}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Failed Deliveries</label>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                    {selectedBroadcast.failedDeliveries?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedBroadcast.createdAt && formatDistanceToNow(new Date(selectedBroadcast.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sent</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedBroadcast.sentAt 
                      ? formatDistanceToNow(new Date(selectedBroadcast.sentAt), { addSuffix: true })
                      : 'Not sent yet'
                    }
                  </p>
                </div>
              </div>

              {selectedBroadcast.status === 'sent' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Rate</label>
                  <div className="mt-1 flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(selectedBroadcast.totalRecipients || 0) > 0 
                            ? (((selectedBroadcast.successfulDeliveries || 0) / (selectedBroadcast.totalRecipients || 1)) * 100)
                            : 0
                          }%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-12">
                      {(selectedBroadcast.totalRecipients || 0) > 0 
                        ? (((selectedBroadcast.successfulDeliveries || 0) / (selectedBroadcast.totalRecipients || 1)) * 100).toFixed(1)
                        : 0
                      }%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

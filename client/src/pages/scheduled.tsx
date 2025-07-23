import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Pause 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";

interface ScheduledMessage {
  id: number;
  title: string;
  message: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'cancelled';
  recipientCount: number;
  createdAt: string;
}

export default function ScheduledPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    scheduledFor: ''
  });

  const { data: scheduledMessages, isLoading } = useQuery({
    queryKey: ['/api/scheduled-messages'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/users/stats'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/scheduled-messages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-messages'] });
      setIsDialogOpen(false);
      setFormData({ title: '', message: '', scheduledFor: '' });
      toast({ title: "Scheduled message created successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scheduled message",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/scheduled-messages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-messages'] });
      setIsDialogOpen(false);
      setEditingMessage(null);
      setFormData({ title: '', message: '', scheduledFor: '' });
      toast({ title: "Scheduled message updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update scheduled message",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/scheduled-messages/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-messages'] });
      toast({ title: "Scheduled message deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete scheduled message",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/scheduled-messages/${id}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-messages'] });
      toast({ title: "Scheduled message cancelled successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel scheduled message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMessage) {
      updateMutation.mutate({ id: editingMessage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (message: ScheduledMessage) => {
    setEditingMessage(message);
    setFormData({
      title: message.title,
      message: message.message,
      scheduledFor: message.scheduledFor.slice(0, 16) // Format for datetime-local input
    });
    setIsDialogOpen(true);
  };

  const handleNewMessage = () => {
    setEditingMessage(null);
    setFormData({ title: '', message: '', scheduledFor: '' });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sent</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Messages</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Schedule broadcasts to be sent automatically</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewMessage} className="telegram-bg hover:telegram-bg-dark text-white">
                <Plus size={16} className="mr-2" />
                Schedule Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingMessage ? 'Edit Scheduled Message' : 'Schedule New Message'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Message title..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Type your message here..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledFor">Schedule For</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="telegram-bg hover:telegram-bg-dark text-white"
                  >
                    {editingMessage ? 'Update' : 'Schedule'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {Array.isArray(scheduledMessages) 
                    ? scheduledMessages.filter((m: any) => m.status === 'pending').length 
                    : 0}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Recipients Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {(stats as any)?.total || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Messages Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {Array.isArray(scheduledMessages) 
                    ? scheduledMessages.filter((m: any) => m.status === 'sent').length 
                    : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading scheduled messages...</div>
            ) : !scheduledMessages || (Array.isArray(scheduledMessages) && scheduledMessages.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                No scheduled messages yet. Create your first one!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(scheduledMessages) && scheduledMessages.map((message: ScheduledMessage) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">{message.title}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {message.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(message.scheduledFor), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell>{message.recipientCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {message.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(message)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => cancelMutation.mutate(message.id)}
                                disabled={cancelMutation.isPending}
                              >
                                <Pause size={16} />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteMutation.mutate(message.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
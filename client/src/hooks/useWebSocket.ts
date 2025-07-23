import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Temporarily disable WebSocket to prevent connection errors
    // The application works fine with regular HTTP requests and polling
    console.log('WebSocket disabled to prevent connection errors');
    setIsConnected(false);
    
    return () => {
      // Cleanup function (no WebSocket to clean up)
    };
  }, []);

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'NEW_USER_REGISTERED':
        toast({
          title: '🎉 New User Registered',
          description: message.data.message,
        });
        // Invalidate user-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;
        
      case 'USER_STATUS_UPDATED':
        toast({
          title: '📝 User Status Updated',
          description: message.data.message,
        });
        // Invalidate user-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;
        
      case 'USER_REMOVED':
        toast({
          title: '🗑️ User Removed',
          description: message.data.message,
          variant: 'destructive',
        });
        // Invalidate user-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;
        
      case 'USER_PHONE_UPDATED':
        toast({
          title: '📱 Phone Number Updated',
          description: message.data.message,
        });
        // Invalidate user-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        break;
        
      case 'BROADCAST_COMPLETED':
        toast({
          title: '📢 Broadcast Completed',
          description: message.data.message,
        });
        // Invalidate broadcast-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/broadcasts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  return { isConnected };
}
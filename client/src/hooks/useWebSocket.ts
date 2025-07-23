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

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      try {
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };
        
        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        };
        
        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setTimeout(connect, 3000);
      }
    };
    
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
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
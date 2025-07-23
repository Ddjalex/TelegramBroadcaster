import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export function DashboardClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Time</p>
            <p className="text-3xl font-bold font-mono text-gray-900 dark:text-white mt-2">
              {formatTime(currentTime)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(currentTime)}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Clock className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
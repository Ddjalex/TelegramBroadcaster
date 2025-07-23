import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function RealTimeClock() {
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Clock size={16} className="text-blue-500" />
      <div className="flex flex-col">
        <span className="font-mono font-medium text-gray-900 dark:text-white">
          {formatTime(currentTime)}
        </span>
        <span className="text-xs">
          {formatDate(currentTime)}
        </span>
      </div>
    </div>
  );
}
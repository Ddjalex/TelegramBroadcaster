import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function HeaderClock() {
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
      hour12: true
    });
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Clock size={16} className="text-blue-500" />
      <span className="font-mono font-medium text-gray-900 dark:text-white">
        {formatTime(currentTime)}
      </span>
    </div>
  );
}
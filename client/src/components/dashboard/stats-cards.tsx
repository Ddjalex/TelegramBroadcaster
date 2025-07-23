import { Card, CardContent } from "@/components/ui/card";
import { Users, Send, CheckCircle, Eye, ArrowUp } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    messagesSent: number;
    deliveryRate: number;
    activeToday: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: "+12.5% from last month",
      changeType: "positive" as const,
      icon: Users,
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Messages Sent",
      value: stats.messagesSent.toLocaleString(),
      change: "+8.2% this week",
      changeType: "positive" as const,
      icon: Send,
      iconBg: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Delivery Rate",
      value: `${stats.deliveryRate}%`,
      change: "Excellent performance",
      changeType: "neutral" as const,
      icon: CheckCircle,
      iconBg: "telegram-bg-light",
      iconColor: "telegram-text",
    },
    {
      title: "Active Today",
      value: stats.activeToday.toLocaleString(),
      change: `${((stats.activeToday / stats.totalUsers) * 100).toFixed(1)}% of total users`,
      changeType: "neutral" as const,
      icon: Eye,
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <Card key={card.title} className="border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{card.value}</p>
                  <p className={`text-sm mt-2 flex items-center ${
                    card.changeType === "positive" 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {card.changeType === "positive" && <ArrowUp size={14} className="mr-1" />}
                    {card.changeType === "positive" && <CheckCircle size={14} className="mr-1" />}
                    <span>{card.change}</span>
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} text-xl`} size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, MessageSquare, TrendingUp, Activity, Clock, Send, CheckCircle, XCircle, UserPlus } from "lucide-react";

interface EnhancedStatsProps {
  stats: {
    totalUsers: number;
    messagesSent: number;
    deliveryRate: number;
    activeToday: number;
  };
  userStats: {
    total: number;
    activeToday: number;
    newThisMonth: number;
  };
}

export function EnhancedStats({ stats, userStats }: EnhancedStatsProps) {
  const deliveryColor = stats.deliveryRate >= 95 ? "text-green-600" : stats.deliveryRate >= 80 ? "text-yellow-600" : "text-red-600";
  const deliveryBgColor = stats.deliveryRate >= 95 ? "bg-green-50 border-green-200" : stats.deliveryRate >= 80 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Users */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Users
          </CardTitle>
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats.total.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                +{userStats.newThisMonth} this month
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <UserPlus className="h-3 w-3 mr-1" />
              Growing
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </CardContent>
      </Card>

      {/* Active Today */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Active Today
          </CardTitle>
          <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats.activeToday.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {userStats.total > 0 ? Math.round((userStats.activeToday / userStats.total) * 100) : 0}% of total users
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          <Progress value={userStats.total > 0 ? (userStats.activeToday / userStats.total) * 100 : 0} className="mt-3 h-2" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
        </CardContent>
      </Card>

      {/* Messages Sent */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Messages Sent
          </CardTitle>
          <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.messagesSent.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total broadcasts
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <MessageSquare className="h-3 w-3 mr-1" />
              Sent
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
        </CardContent>
      </Card>

      {/* Delivery Rate */}
      <Card className={`relative overflow-hidden ${deliveryBgColor}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Delivery Rate
          </CardTitle>
          <div className={`p-2 rounded-lg ${stats.deliveryRate >= 95 ? 'bg-green-100 dark:bg-green-900' : stats.deliveryRate >= 80 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {stats.deliveryRate >= 95 ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : stats.deliveryRate >= 80 ? (
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className={`text-2xl font-bold ${deliveryColor}`}>
                {stats.deliveryRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Message success rate
              </p>
            </div>
            <Badge 
              variant={stats.deliveryRate >= 95 ? "default" : "secondary"} 
              className={stats.deliveryRate >= 95 ? "bg-green-600 text-white" : stats.deliveryRate >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}
            >
              {stats.deliveryRate >= 95 ? "Excellent" : stats.deliveryRate >= 80 ? "Good" : "Needs Attention"}
            </Badge>
          </div>
          <Progress value={stats.deliveryRate} className="mt-3 h-2" />
          <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${stats.deliveryRate >= 95 ? 'from-green-500 to-green-600' : stats.deliveryRate >= 80 ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600'}`}></div>
        </CardContent>
      </Card>
    </div>
  );
}
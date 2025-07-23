import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, UserPlus, Calendar } from "lucide-react";
import { UserActions } from "@/components/users/user-actions";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@shared/schema";

export default function Users() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/stats"],
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your registered Telegram users</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <Download size={16} className="mr-2" />
              Export Users
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {(userStats as any)?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Today</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {(userStats as any)?.activeToday?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New This Month</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {(userStats as any)?.newThisMonth?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {users && Array.isArray(users) && users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users as User[]).map((user: User) => {
                    const isActive = user.lastActiveAt && 
                      new Date().getTime() - new Date(user.lastActiveAt).getTime() < 24 * 60 * 60 * 1000;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {(user.firstName?.[0] || '') + (user.lastName?.[0] || user.username?.[0] || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {user.telegramId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            @{user.username || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {(user as any).phoneNumber || 'Not provided'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={isActive ? "default" : "secondary"}>
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                            {(user as any).phoneNumber && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDistanceToNow(new Date(user.joinedAt!), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {user.lastActiveAt 
                              ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                              : 'Never'
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Actions</span>
                            •••
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users yet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Users will appear here when they start your Telegram bot
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

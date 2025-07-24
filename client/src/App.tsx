import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Compose from "@/pages/compose";
import Users from "@/pages/users";
import History from "@/pages/history";
import ScheduledPage from "@/pages/scheduled";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  // WebSocket is disabled, so connection is always false
  const isConnected = false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <LoginPage />
        </Route>
      </Switch>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar isWebSocketConnected={isConnected} />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/compose" component={Compose} />
        <Route path="/users" component={Users} />
        <Route path="/history" component={History} />
        <Route path="/scheduled" component={ScheduledPage} />
        <Route path="/settings" component={Settings} />
        <Route path="/login" component={LoginPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

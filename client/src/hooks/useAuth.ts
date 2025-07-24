import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: number;
  username: string;
}

interface AuthResponse {
  authenticated: boolean;
  admin?: AuthUser;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  admin?: AuthUser;
  error?: string;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user: data?.admin,
    isAuthenticated: data?.authenticated || false,
    isLoading,
    error,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: credentials,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate and refetch auth state
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries(); // Invalidate all queries to refresh protected data
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      // Clear all cached data and redirect to login
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      return await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: data,
      });
    },
  });
}
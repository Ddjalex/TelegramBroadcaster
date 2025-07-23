import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = localStorage.getItem('admin_authenticated') === 'true';
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    // Force page reload to ensure clean state
    window.location.reload();
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
}
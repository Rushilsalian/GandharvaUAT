import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from './use-toast';
import { isSessionExpired, clearSessionData } from '../lib/sessionUtils';

export const useSessionExpiration = () => {
  const { logout, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();

  const handleSessionExpired = useCallback((message: string = 'Session expired. Please login again.') => {
    clearSessionData();
    logout();
    toast({
      title: "Session Expired",
      description: message,
      variant: "destructive",
    });
    setLocation('/');
  }, [logout, setLocation]);

  const handleUnauthorized = useCallback((message: string = 'Session not authorized. Please login again.') => {
    clearSessionData();
    logout();
    toast({
      title: "Unauthorized Access",
      description: message,
      variant: "destructive",
    });
    setLocation('/');
  }, [logout, setLocation]);

  // Check session validity periodically
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkSession = () => {
      if (isSessionExpired()) {
        handleSessionExpired();
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [isLoggedIn, handleSessionExpired]);

  return {
    handleSessionExpired,
    handleUnauthorized
  };
};
import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from './use-toast';
import { validateAndCleanSession, updateLastActivity } from '../lib/sessionUtils';

export const useSessionExpiration = () => {
  const { logout, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();

  const handleSessionExpired = useCallback((message: string = 'Session expired. Please login again.') => {
    logout();
    toast({
      title: "Session Expired",
      description: message,
      variant: "destructive",
    });
    setLocation('/');
  }, [logout, setLocation]);

  const handleUnauthorized = useCallback((message: string = 'Session not authorized. Please login again.') => {
    logout();
    toast({
      title: "Unauthorized Access",
      description: message,
      variant: "destructive",
    });
    setLocation('/');
  }, [logout, setLocation]);

  // Reset inactivity timer on any user activity
  useEffect(() => {
    if (!isLoggedIn) return;

    const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];

    const onActivity = () => updateLastActivity();

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, onActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity));
    };
  }, [isLoggedIn]);

  // Check session validity periodically
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkSession = () => {
      if (!validateAndCleanSession()) {
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
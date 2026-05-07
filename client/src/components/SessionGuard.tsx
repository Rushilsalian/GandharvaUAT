import { useEffect } from 'react';
import { useSessionExpiration } from '@/hooks/useSessionExpiration';
import { useAuth } from '@/contexts/AuthContext';
import { validateAndCleanSession } from '@/lib/sessionUtils';

interface SessionGuardProps {
  children: React.ReactNode;
}

export const SessionGuard = ({ children }: SessionGuardProps) => {
  const { isLoggedIn, token } = useAuth();
  const { handleSessionExpired } = useSessionExpiration();

  useEffect(() => {
    // Synchronously validate session on every render
    if (isLoggedIn && !validateAndCleanSession()) {
      handleSessionExpired('Session expired. Please login again.');
      return;
    }

    // Check if user is supposed to be logged in but has no token
    if (isLoggedIn && !token) {
      handleSessionExpired('Session invalid. Please login again.');
      return;
    }
  }, [isLoggedIn, token, handleSessionExpired]);

  // Additional check on window focus (when user returns to tab)
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleFocus = () => {
      if (!validateAndCleanSession()) {
        handleSessionExpired('Session expired while away. Please login again.');
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn, handleSessionExpired]);

  return <>{children}</>;
};
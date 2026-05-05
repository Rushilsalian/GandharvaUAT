import { useEffect } from 'react';
import { useSessionExpiration } from '@/hooks/useSessionExpiration';
import { useAuth } from '@/contexts/AuthContext';
import { isSessionExpired } from '@/lib/sessionUtils';

interface SessionGuardProps {
  children: React.ReactNode;
}

export const SessionGuard = ({ children }: SessionGuardProps) => {
  const { isLoggedIn, token } = useAuth();
  const { handleSessionExpired } = useSessionExpiration();

  useEffect(() => {
    // Check if user is supposed to be logged in but has no token
    if (isLoggedIn && !token) {
      handleSessionExpired('Session invalid. Please login again.');
      return;
    }

    // Check session storage consistency
    const storedToken = sessionStorage.getItem('authToken');
    const loginTime = sessionStorage.getItem('loginTime');
    
    if (isLoggedIn && (!storedToken || !loginTime)) {
      handleSessionExpired('Session data corrupted. Please login again.');
      return;
    }

    // Always check session expiration when component mounts or updates
    if (isLoggedIn && isSessionExpired()) {
      handleSessionExpired('Session expired due to inactivity. Please login again.');
      return;
    }
  }, [isLoggedIn, token, handleSessionExpired]);

  // Additional check on window focus (when user returns to tab)
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleFocus = () => {
      if (isSessionExpired()) {
        handleSessionExpired('Session expired while away. Please login again.');
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn, handleSessionExpired]);

  return <>{children}</>;
};
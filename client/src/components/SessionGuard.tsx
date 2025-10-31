import { useEffect } from 'react';
import { useSessionExpiration } from '@/hooks/useSessionExpiration';
import { useAuth } from '@/contexts/AuthContext';

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
  }, [isLoggedIn, token, handleSessionExpired]);

  return <>{children}</>;
};
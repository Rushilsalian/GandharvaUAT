import { useAuth } from '../contexts/AuthContext';

export const useSession = () => {
  const { user, client, role, session, token, refreshSession } = useAuth();

  // Helper functions for session data
  const getUserId = () => session?.userId || user?.userId || user?.id;
  
  const getUserRole = () => role?.roleName || user?.role || session?.roleName;
  
  const getClientId = () => {
    // Try multiple sources for client ID
    return session?.clientId || client?.id;
  };
  
  const isAdmin = () => {
    const userRole = getUserRole();
    return userRole === 'admin' || userRole === 'Admin';
  };
  
  const isClient = () => {
    const userRole = getUserRole();
    return userRole === 'client' || userRole === 'Client';
  };
  
  const isLeader = () => {
    const userRole = getUserRole();
    return userRole === 'leader' || userRole === 'Leader';
  };
  
  const hasPermission = (permission: string) => {
    // Basic permission check based on role
    const userRole = getUserRole()?.toLowerCase();
    
    switch (permission.toLowerCase()) {
      case 'admin':
        return userRole === 'admin';
      case 'manage_users':
        return userRole === 'admin' || userRole === 'leader';
      case 'view_clients':
        return userRole === 'admin' || userRole === 'leader';
      case 'manage_transactions':
        return userRole === 'admin' || userRole === 'leader';
      case 'view_own_data':
        return true; // All authenticated users can view their own data
      default:
        return false;
    }
  };
  
  const getSessionInfo = () => ({
    userId: getUserId(),
    userRole: getUserRole(),
    clientId: getClientId(),
    loginTime: session?.loginTime,
    lastAccessed: session?.lastAccessed,
    userType: session?.userType,
    isAuthenticated: !!token
  });

  return {
    // Session data
    user,
    client,
    role,
    session,
    token,
    
    // Helper functions
    getUserId,
    getUserRole,
    getClientId,
    isAdmin,
    isClient,
    isLeader,
    hasPermission,
    getSessionInfo,
    refreshSession
  };
};
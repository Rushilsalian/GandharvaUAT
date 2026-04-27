export const SESSION_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours inactivity

export const initializeSession = (): void => {
  sessionStorage.setItem('lastActivity', Date.now().toString());
};

export const updateLastActivity = (): void => {
  sessionStorage.setItem('lastActivity', Date.now().toString());
};

export const isSessionExpired = (): boolean => {
  const lastActivity = sessionStorage.getItem('lastActivity');
  const authToken = sessionStorage.getItem('authToken');
  
  if (!authToken) return true;
  if (!lastActivity) return false; // Just logged in, not expired yet

  const currentTime = Date.now();
  const inactiveTime = currentTime - parseInt(lastActivity);
  
  return inactiveTime > SESSION_TIMEOUT;
};

export const getSessionTimeRemaining = (): number => {
  const lastActivity = sessionStorage.getItem('lastActivity');
  if (!lastActivity) return 0;

  const currentTime = Date.now();
  const inactiveTime = currentTime - parseInt(lastActivity);
  const remaining = SESSION_TIMEOUT - inactiveTime;
  
  return Math.max(0, remaining);
};

export const clearSessionData = (): void => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('client');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('session');
  sessionStorage.removeItem('loginTime');
  sessionStorage.removeItem('lastActivity');
};
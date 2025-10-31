export const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const isSessionExpired = (): boolean => {
  const loginTime = sessionStorage.getItem('loginTime');
  if (!loginTime) return true;

  const currentTime = Date.now();
  const sessionAge = currentTime - parseInt(loginTime);
  
  return sessionAge > SESSION_TIMEOUT;
};

export const getSessionTimeRemaining = (): number => {
  const loginTime = sessionStorage.getItem('loginTime');
  if (!loginTime) return 0;

  const currentTime = Date.now();
  const sessionAge = currentTime - parseInt(loginTime);
  const remaining = SESSION_TIMEOUT - sessionAge;
  
  return Math.max(0, remaining);
};

export const clearSessionData = (): void => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('client');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('session');
  sessionStorage.removeItem('loginTime');
};
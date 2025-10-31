// API utility functions with JWT authentication

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Global session handlers
let globalSessionExpiredHandler: ((message: string) => void) | null = null;
let globalUnauthorizedHandler: ((message: string) => void) | null = null;

export function setGlobalSessionHandlers(
  onSessionExpired: (message: string) => void,
  onUnauthorized: (message: string) => void
) {
  globalSessionExpiredHandler = onSessionExpired;
  globalUnauthorizedHandler = onUnauthorized;
}

export async function apiRequest(
  url: string, 
  options: RequestInit = {}
): Promise<any> {
  const token = sessionStorage.getItem('authToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({ error: 'Session expired' }));
    const message = errorData.error || 'Session expired. Please login again.';
    
    if (globalSessionExpiredHandler) {
      globalSessionExpiredHandler(message);
    }
    
    throw new ApiError(response.status, message);
  }
  
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({ error: 'Access denied' }));
    const message = errorData.error || 'Session not authorized. Please login again.';
    
    if (globalUnauthorizedHandler) {
      globalUnauthorizedHandler(message);
    }
    
    throw new ApiError(response.status, message);
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (url: string) => apiRequest(url),
  post: (url: string, data: any) => apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (url: string, data: any) => apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (url: string) => apiRequest(url, { method: 'DELETE' }),
};
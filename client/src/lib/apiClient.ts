// API client with session management
class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private onSessionExpired?: (message: string) => void;
  private onUnauthorized?: (message: string) => void;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.token = sessionStorage.getItem('authToken');
    
    // Set up default session handlers
    this.setSessionHandlers(
      (message) => {
        console.warn('Session expired:', message);
        window.location.href = '/';
      },
      (message) => {
        console.warn('Unauthorized:', message);
        window.location.href = '/';
      }
    );
  }

  setSessionHandlers(onSessionExpired: (message: string) => void, onUnauthorized: (message: string) => void) {
    this.onSessionExpired = onSessionExpired;
    this.onUnauthorized = onUnauthorized;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('authToken', token);
    } else {
      sessionStorage.removeItem('authToken');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({ error: 'Session expired' }));
      const message = errorData.error || 'Session expired. Please login again.';
      
      this.setToken(null);
      
      if (this.onSessionExpired) {
        this.onSessionExpired(message);
      } else {
        window.location.href = '/';
      }
      
      throw new Error(message);
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ error: 'Access denied' }));
      const message = errorData.error || 'Session not authorized. Please login again.';
      
      if (this.onUnauthorized) {
        this.onUnauthorized(message);
      }
      
      throw new Error(message);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async get(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async put(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Session-specific methods
  async getSession() {
    return this.get('/auth/session');
  }

  async login(email: string, password: string) {
    // Don't use this.post to avoid token requirement for login
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await this.handleResponse(response);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async signup(userData: any) {
    // Don't use this.post to avoid token requirement for signup
    const response = await fetch(`${this.baseURL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    const data = await this.handleResponse(response);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  logout() {
    this.setToken(null);
    // Clear all session data
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('client');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('session');
    sessionStorage.removeItem('loginTime');
  }

  // Client management methods
  async getClients() {
    return this.get('/mst/clients');
  }

  async getClient(id: number) {
    return this.get(`/mst/clients/${id}`);
  }
}

export const apiClient = new ApiClient();
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isSessionExpired, clearSessionData } from '../lib/sessionUtils';
import { apiClient } from '../lib/apiClient';

interface User {
  userId?: number;
  id?: string;
  userName?: string;
  email?: string;
  mobile?: string;
  role?: 'admin' | 'leader' | 'client';
  roleId?: number;
  firstName?: string;
  lastName?: string;
  branchId?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface Client {
  id: string;
  userId: string;
  clientCode: string;
  name: string;
  panNumber?: string;
  aadharNumber?: string;
  dateOfBirth?: string;
  address?: string;
  nomineeDetails?: string;
  bankDetails?: string;
  kycStatus: string;
  totalInvestment: string;
  currentValue: string;
  createdAt: string;
}

interface Session {
  userId: number | string;
  email?: string;
  roleId?: number;
  roleName?: string;
  role?: string | { name: string; roleId: number; [key: string]: any };
  clientId?: number | string | null;
  userType: 'master' | 'legacy';
  loginTime: string;
  lastAccessed?: string;
  moduleAccess?: Record<string, {
    moduleId: number;
    moduleName: string;
    accessRead: number;
    accessWrite: number;
    accessUpdate: number;
    accessDelete: number;
    accessExport?: number;
    roleId: number;
    roleName: string;
    userId: number;
    userType: string;
  }>;
}

interface Role {
  roleId: number;
  roleName: string;
  description?: string;
}

interface AuthContextType {
  user: User | null;
  client: Client | null;
  role: Role | null;
  session: Session | null;
  isLoggedIn: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Login successful:", data);
        
        // Decode JWT to get session data including roleName
        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        
        // Set all session data
        setUser(data.user);
        setClient(data.client);
        setRole(data.role);
        setSession({ ...data.session, roleName: tokenPayload.roleName });
        setToken(data.token);
        setIsLoggedIn(true);
        
        // Store session data in sessionStorage for persistence
        const loginTime = Date.now();
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('session', JSON.stringify(data.session));
        sessionStorage.setItem('loginTime', loginTime.toString());
        if (data.client) sessionStorage.setItem('client', JSON.stringify(data.client));
        if (data.role) sessionStorage.setItem('role', JSON.stringify(data.role));
        
        // Update apiClient with token
        apiClient.setToken(data.token);
      } else {
        const errorData = await response.json();
        console.error("Login error details:", errorData);
        throw new Error(errorData.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const signupData = {
        userName: name.toLowerCase().replace(/\s+/g, '_'),
        password,
        email: email.includes('@') ? email : null,
        mobile: email.match(/^\d+$/) ? email : null,
        roleId: 3
      };
      
      console.log('Sending signup data:', { ...signupData, password: '***' });
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Signup successful:", data);
        
        // Set all session data from signup response
        setUser(data.user);
        setRole(data.role);
        setSession(data.session);
        setToken(data.token);
        setIsLoggedIn(true);
        
        // Store session data in sessionStorage for persistence
        const loginTime = Date.now();
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('session', JSON.stringify(data.session));
        sessionStorage.setItem('loginTime', loginTime.toString());
        if (data.role) sessionStorage.setItem('role', JSON.stringify(data.role));
        
        // Update apiClient with token
        apiClient.setToken(data.token);
      } else {
        const errorData = await response.json();
        console.error("Signup error details:", errorData);
        throw new Error(errorData.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const refreshSession = async () => {
    const storedToken = sessionStorage.getItem('authToken');
    if (!storedToken) return;
    
    try {
      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setClient(data.client);
        setRole(data.role);
        setSession(data.session);
        
        // Update sessionStorage with fresh data
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('session', JSON.stringify(data.session));
        if (data.client) {
          sessionStorage.setItem('client', JSON.stringify(data.client));
        } else {
          sessionStorage.removeItem('client');
        }
        if (data.role) {
          sessionStorage.setItem('role', JSON.stringify(data.role));
        } else {
          sessionStorage.removeItem('role');
        }
      } else if (response.status === 401 || response.status === 403) {
        // Token expired or unauthorized, logout
        logout();
        throw new Error('Session expired or unauthorized');
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setClient(null);
    setRole(null);
    setSession(null);
    setToken(null);
    setIsLoggedIn(false);
    apiClient.logout();
    clearSessionData();
  };

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('authToken');
    const storedUser = sessionStorage.getItem('user');
    const storedSession = sessionStorage.getItem('session');
    const storedClient = sessionStorage.getItem('client');
    const storedRole = sessionStorage.getItem('role');
    const loginTime = sessionStorage.getItem('loginTime');
    
    if (storedToken && storedUser && loginTime) {
      if (isSessionExpired()) {
        logout();
        return;
      }
      
      try {
        const userData = JSON.parse(storedUser);
        const sessionData = storedSession && storedSession !== 'undefined' ? JSON.parse(storedSession) : null;
        const clientData = storedClient && storedClient !== 'undefined' && storedClient !== 'null' ? JSON.parse(storedClient) : null;
        const roleData = storedRole && storedRole !== 'undefined' && storedRole !== 'null' ? JSON.parse(storedRole) : null;
        
        setToken(storedToken);
        setUser(userData);
        setSession(sessionData);
        setClient(clientData);
        setRole(roleData);
        setIsLoggedIn(true);
        
        // Update apiClient with stored token
        apiClient.setToken(storedToken);
        
        // Auto-refresh session to get latest data
        refreshSession();
      } catch (error) {
        console.error('Failed to restore session:', error);
        logout();
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        client,
        role,
        session,
        isLoggedIn,
        token,
        login,
        signup,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
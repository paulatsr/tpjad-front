import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

// Helper function to decode JWT token
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Verify token is still valid
        const decoded = decodeJWT(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser(parsedUser);
        } else {
          // Token expired, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const token = await authAPI.login(username, password);
      
      // Decode token to get user info
      const decoded = decodeJWT(token);
      if (!decoded) {
        throw new Error('Failed to decode token');
      }
      
      // Store token
      localStorage.setItem('token', token);
      
      // Create user object from decoded token (now includes userId)
      const userData = {
        userId: decoded.userId || null,
        username: decoded.sub || username,
        role: decoded.role || 'ADMIN',
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('[AuthContext] User logged in:', userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken , removeToken, setToken} from '../utils/function'

interface AuthContextType {
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getToken();
  });

  const login = (userData: any) => {
    setToken(userData?.token)
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeToken()
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

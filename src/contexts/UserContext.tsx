import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, removeToken, setToken } from "../utils/function";

type UserType = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
};

type UserContextType = {
  user: UserType | null;
  setUserFromToken: (token: string) => Promise<void>;
  clearUser: () => void;
  refreshUserFromCurrentToken: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUserFromToken: async () => { },
  clearUser: () => { },
  refreshUserFromCurrentToken: async () => { },
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);

  const setUserFromToken = async (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      setToken(token);
      setUser(decoded);
    } catch (err) {
      console.error("Failed to set user from token", err);
      clearUser();
    }
  };

  const refreshUserFromCurrentToken = async () => {
    const token = getToken();
    if (token) {
      await setUserFromToken(token);
    }
  };

  const clearUser = () => {
    setUser(null);
    removeToken();
  };

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token && !user) {
        try {
          const decoded: any = jwtDecode(token);
          setToken(token);
          setUser(decoded);
        } catch (err) {
          console.error("Failed to set user from token", err);
          clearUser();
        }
      }
    })();
    // run on mount and when user changes
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUserFromToken, clearUser, refreshUserFromCurrentToken }}>
      {children}
    </UserContext.Provider>
  );
};
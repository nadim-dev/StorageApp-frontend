import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { currentUser as currentUserApi } from "../api/userApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
 
  const fetchCurrentUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const data = await currentUserApi();
      setCurrentUser(data);
      return data;
    } catch (err) {
      if (err?.status === 401 || err?.response?.status === 401) {
        setCurrentUser(null);
        return null;
      }
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser().catch((err) => {
      console.error("Failed to fetch current user:", err);
    });
  }, [fetchCurrentUser]);

  const value = {
    currentUser,
    setCurrentUser,
    authLoading,
    fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

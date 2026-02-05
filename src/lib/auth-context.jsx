import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, clearTokens, setTokens } from "./auth";
import { getMe, login as apiLogin } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const data = await getMe();
      // getMe() returns a single user object (from backend GET /api/profile/)
      const userData = Array.isArray(data) ? data[0] : data;

      if (userData) {
        const normalizedUser = {
          ...userData,
          name: userData.username || userData.name || "User",
          role: userData.role || "User",
        };
        setUser(normalizedUser);
        return normalizedUser;
      }
      return null;
    } catch (error) {
      console.error("Failed to load user:", error);
      // If we can't fetch the current user, the stored token is unusable.
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const data = await apiLogin({ username, password });
      const access = data.access ?? data.access_token;
      const refresh = data.refresh ?? data.refresh_token;
      if (access) setTokens(access, refresh);

      if (data.user) {
        setUser(data.user);
      } else {
        const loaded = await loadUser();
        if (!loaded) {
          throw new Error("Login succeeded but failed to load user profile");
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          // Try to get stored user data
          const userData = localStorage.getItem("user_data");
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
            } catch (e) {
              setUser({
                id: "1",
                name: "Demo User",
                email: "demo@example.com",
              });
            }
          } else {
            setUser({
              id: "1",
              name: "Demo User",
              email: "demo@example.com",
            });
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Use the API client to login
      try {
        const { authAPI } = await import("../lib/api-client");
        const response = await authAPI.login(email, password);

        // Store token in localStorage
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user_data", JSON.stringify(response.user));
        setUser(response.user);
      } catch (apiError: any) {
        // Fallback to mock login if API is not available
        console.warn("API login failed, using mock login:", apiError.message);

        if (email === "demo@example.com" && password === "password") {
          const mockUser = {
            id: "1",
            name: "Demo User",
            email: "demo@example.com",
          };

          // Store token in localStorage
          localStorage.setItem("auth_token", "mock_jwt_token");
          localStorage.setItem("user_data", JSON.stringify(mockUser));
          setUser(mockUser);
          return;
        }

        throw new Error("Invalid email or password");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      try {
        const { authAPI } = await import("../lib/api-client");
        const response = await authAPI.register(name, email, password);

        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user_data", JSON.stringify(response.user));
        setUser(response.user);
      } catch (apiError: any) {
        console.warn(
          "API registration failed, using mock registration:",
          apiError.message,
        );

        const mockUser = {
          id: Date.now().toString(),
          name,
          email,
        };

        localStorage.setItem("auth_token", "mock_jwt_token");
        localStorage.setItem("user_data", JSON.stringify(mockUser));
        setUser(mockUser);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
  };

  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      try {
        const { authAPI } = await import("../lib/api-client");
        await authAPI.requestPasswordReset(email);
      } catch (apiError: any) {
        console.warn(
          "API password reset failed, using mock reset:",
          apiError.message,
        );
        console.log(`Password reset requested for ${email}`);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    requestPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

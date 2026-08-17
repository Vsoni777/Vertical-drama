import { createContext, useState } from "react";
import type { ReactNode } from "react";

export interface User {
  id: number;
  email: string;
  role: "viewer" | "admin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext =
  createContext<AuthContextType>(
    {} as AuthContextType
  );

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("token"));

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem("user");
    try { return savedUser ? JSON.parse(savedUser) as User : null; } catch { return null; }
  });

  const login = (
    token: string,
    user: User
  ) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setToken(token);
    setUser(user);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

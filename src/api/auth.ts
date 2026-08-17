import api from "./api";

export const login = (data: {
  email: string;
  password: string;
}) => {
  return api.post("/login", {
    user: data,
  });
};

export const register = (data: {
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  return api.post("/users", {
    user: data,
  });
};

export const logout = () => {
  return api.delete("/logout");
};

export const requestPasswordReset = (email: string) =>
  api.post("/users/password", { user: { email } });

export const resetPassword = (data: {
  reset_password_token: string;
  password: string;
  password_confirmation: string;
}) => api.put("/users/password", { user: data });

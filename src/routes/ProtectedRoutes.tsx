import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";

interface Props {
  children: ReactNode;
  roles?: User["role"][];
}

export default function ProtectedRoutes({
  children,
  roles,
}: Props) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
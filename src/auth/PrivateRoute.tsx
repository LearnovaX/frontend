import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.tsx";

export const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuth();
  return accessToken ? <>{children}</> : <Navigate to="/login" />;
};
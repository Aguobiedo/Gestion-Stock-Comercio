// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  isAuthenticated: boolean;
  children: React.ReactNode; // 🔹 cambio aquí
}

const ProtectedRoute = ({ isAuthenticated, children }: Props) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>; // envolvemos en fragmento
};

export default ProtectedRoute;

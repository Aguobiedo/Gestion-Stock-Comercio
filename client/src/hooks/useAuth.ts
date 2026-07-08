// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    setToken(token);
    navigate("/home"); // redirige al Home
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login"); // redirige al login
  };

const isAuthenticated = () => !!localStorage.getItem("token");

  return { token, login, logout, isAuthenticated };
};

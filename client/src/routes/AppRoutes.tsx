import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "../pages/login/login";
import Home from "../pages/home/home";
import Inventario from "../pages/inventario/inventario";
import Historial_ventas from "../pages/historial_ventas/historial_ventas";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../hooks/useAuth";
import "./AppRoutes.css";

const AppRoutes = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Función para determinar qué enlace está activo
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Renderizar Layout solo en rutas protegidas
  const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="brand">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
              </svg>
            </div>
            <span>StockCent</span>
          </div>

          <nav className="nav-menu">
            <a 
              href="/home" 
              className={`nav-link ${isActiveRoute('/home') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Ventas
            </a>
            <a 
              href="/inventario" 
              className={`nav-link ${isActiveRoute('/inventario') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              Inventario
            </a>
            <a 
              href="/historial_ventas" 
              className={`nav-link ${isActiveRoute('/historial_ventas') ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
              Historial ventas
            </a>
          </nav>

          <button onClick={logout} className="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          {children}
        </main>
      </div>
    );
  };

  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas con layout compartido */}
      <Route
        path="/home"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated()}>
            <ProtectedLayout>
              <Home />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventario"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated()}>
            <ProtectedLayout>
              <Inventario /> 
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/historial_ventas"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated()}>
            <ProtectedLayout>
              <Historial_ventas />     
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirección para cualquier ruta desconocida */}
      <Route
        path="*"
        element={
          isAuthenticated() ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
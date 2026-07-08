// src/pages/Login/Login.tsx
import React, { useState } from "react";
import { loginAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import './login.css';

const Login = () => {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await loginAPI(usuario, password);
      login(data.token);
    } catch (err: any) {
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {/* Icono de Bolsa de Supermercado SVG */}
          <svg className="login-logo" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2>StockCent</h2>
          <p>Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              type="text"
              placeholder="Ej. cajero01"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? "Cargando..." : "Ingresar"}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;
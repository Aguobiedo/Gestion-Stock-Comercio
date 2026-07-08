// src/services/api.ts
const BASE_URL = "http://localhost:3000/api";

export const loginAPI = async (usuario: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usuario, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error en login");
  return data;
};

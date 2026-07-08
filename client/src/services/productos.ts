const BASE_URL = "http://localhost:3000/api";

// Helper para obtener los headers con el token
const getHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No estás autenticado");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getProductos = async () => {
  const res = await fetch(`${BASE_URL}/productos`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener productos");
  return data;
};

export const getProductoById = async (id: number | string) => {
  const res = await fetch(`${BASE_URL}/productos/${id}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener el producto");
  return data;
};

export const getProductoByBarCode = async (barcode: string) => {
  const res = await fetch(`${BASE_URL}/productos/barcode/${barcode}`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Error al obtener el producto");
  }
  return data;
};

export const createProducto = async (producto: any) => {
  const res = await fetch(`${BASE_URL}/productos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(producto),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al crear producto");
  return data;
};

export const updateProducto = async (id: number | string, producto: any) => {
  const res = await fetch(`${BASE_URL}/productos/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(producto),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar producto");
  return data;
};

export const deleteProducto = async (id: number | string) => {
  const res = await fetch(`${BASE_URL}/productos/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar producto");
  return data;
};
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

/* ========================================================================
                            SECCIÓN: VENTAS (CABECERA)
   ======================================================================== */

// OBTENER TODAS LAS VENTAS
export const getVentas = async () => {
  const res = await fetch(`${BASE_URL}/ventas`, {
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener ventas");

  return data;
};

// OBTENER VENTA POR ID
export const getVentaById = async (id: number | string) => {
  const res = await fetch(`${BASE_URL}/ventas/${id}`, {
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener la venta");

  return data;
};

// CREAR VENTA (Inicial, generalmente vacía o con total 0 hasta agregar detalles)
export const createVenta = async (total: number) => {
  const res = await fetch(`${BASE_URL}/ventas`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ total }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al crear la venta");

  return data; // Retorna { message, id }
};

// ACTUALIZAR VENTA (Cabecera, ej: total)
export const updateVenta = async (id: number | string, total: number) => {
  const res = await fetch(`${BASE_URL}/ventas/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ total }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar la venta");

  return data;
};

// ELIMINAR VENTA (y sus detalles en cascada si la BD lo permite, o soft delete)
export const deleteVenta = async (id: number | string) => {
  const res = await fetch(`${BASE_URL}/ventas/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar la venta");

  return data;
};

// TOTAL VENDIDO EN EL DÍA
export const getTotalVentasDelDia = async () => {
  const res = await fetch(`${BASE_URL}/ventas/total-dia`, {
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener total del día");

  return data;
};


/* ========================================================================
                            SECCIÓN: DETALLE DE VENTA
   ======================================================================== */

// OBTENER TODOS LOS DETALLES DE UNA VENTA ESPECÍFICA
// GET /api/detalle_venta/venta/:id
export const getDetallesByVentaId = async (ventaId: number | string) => {
  const res = await fetch(`${BASE_URL}/detalle_venta/venta/${ventaId}`, {
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener los detalles de la venta");

  return data; 
  // Retorna array de objetos: { id, producto_id, producto, cantidad, precio_unitario, subtotal }
};

// AGREGAR UN PRODUCTO A UNA VENTA (CREAR DETALLE)
// POST /api/detalle_venta/venta/:id
export const createDetalleVenta = async (
  ventaId: number | string, 
  detalle: { producto_id: number; cantidad: number; precio_unitario: number }
) => {
  const res = await fetch(`${BASE_URL}/detalle_venta/venta/${ventaId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(detalle),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al agregar producto a la venta");

  return data;
};

// ACTUALIZAR UN DETALLE (CANTIDAD O PRECIO)
// PUT /api/detalle_venta/:detalleId
export const updateDetalleVenta = async (
  detalleId: number | string, 
  detalle: { cantidad: number; precio_unitario: number }
) => {
  const res = await fetch(`${BASE_URL}/detalle_venta/${detalleId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(detalle),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar el detalle de venta");

  return data;
};

// ELIMINAR UN DETALLE (QUITAR PRODUCTO DE LA VENTA)
// DELETE /api/detalle_venta/:detalleId
export const deleteDetalleVenta = async (detalleId: number | string) => {
  const res = await fetch(`${BASE_URL}/detalle_venta/${detalleId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar el producto de la venta");

  return data;
};

// (OPCIONAL) OBTENER TODOS LOS DETALLES GLOBALES
// GET /api/detalle_venta
export const getAllDetalles = async () => {
  const res = await fetch(`${BASE_URL}/detalle_venta`, {
    headers: getHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener historial de detalles");

  return data;
};
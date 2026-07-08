import React, { useEffect, useState, useCallback } from "react";
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from "../../services/productos";
import "./inventario.css";

// --- INTERFACES ---
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock_actual: number;
  codigo_barra: string;
  stock_minimo: number;
  activo: number;
}

interface ProductoForm {
  nombre: string;
  codigo_barra: string;
  precio: string;
  stock_actual: string;
  stock_minimo: string;
}

const Inventario = () => {
  // Estados de datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<"todos" | "critico" | "bajo" | "normal">("todos");

  // Estados del modal
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoActual, setProductoActual] = useState<Producto | null>(null);
  const [procesando, setProcesando] = useState(false);

  // Estados del formulario
  const [form, setForm] = useState<ProductoForm>({
    nombre: "",
    codigo_barra: "",
    precio: "",
    stock_actual: "",
    stock_minimo: "",
  });

  // Estados de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);

  /* ============================================================
     1. CARGA DE DATOS
  ============================================================ */
  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProductos();
      setProductos(data);
      setProductosFiltrados(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      alert("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  /* ============================================================
     2. FILTROS Y BÚSQUEDA
  ============================================================ */
  useEffect(() => {
    let resultado = productos;

    // Filtro por búsqueda
    if (busqueda) {
      resultado = resultado.filter(
        (p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.codigo_barra.includes(busqueda)
      );
    }

    // Filtro por stock
    if (filtroStock === "critico") {
      resultado = resultado.filter((p) => p.stock_actual < p.stock_minimo);
    } else if (filtroStock === "bajo") {
      resultado = resultado.filter(
        (p) => p.stock_actual >= p.stock_minimo && p.stock_actual < p.stock_minimo * 2
      );
    } else if (filtroStock === "normal") {
      resultado = resultado.filter((p) => p.stock_actual >= p.stock_minimo * 2);
    }

    setProductosFiltrados(resultado);
  }, [busqueda, filtroStock, productos]);

  /* ============================================================
     3. ESTADÍSTICAS
  ============================================================ */
  const stats = {
    total: productos.length,
    critico: productos.filter((p) => p.stock_actual < p.stock_minimo).length,
    valorTotal: productos.reduce((acc, p) => acc + p.precio * p.stock_actual, 0),
  };

  /* ============================================================
     4. MODAL - ABRIR/CERRAR
  ============================================================ */
  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setProductoActual(null);
    setForm({
      nombre: "",
      codigo_barra: "",
      precio: "",
      stock_actual: "",
      stock_minimo: "",
    });
    setShowModal(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setModoEdicion(true);
    setProductoActual(producto);
    setForm({
      nombre: producto.nombre,
      codigo_barra: producto.codigo_barra,
      precio: producto.precio.toString(),
      stock_actual: producto.stock_actual.toString(),
      stock_minimo: producto.stock_minimo.toString(),
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setProductoActual(null);
    setForm({
      nombre: "",
      codigo_barra: "",
      precio: "",
      stock_actual: "",
      stock_minimo: "",
    });
  };

  /* ============================================================
     5. FORMULARIO - MANEJO
  ============================================================ */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validarFormulario = (): boolean => {
    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio");
      return false;
    }
    if (!form.precio || parseFloat(form.precio) <= 0) {
      alert("El precio debe ser mayor a 0");
      return false;
    }
    if (form.stock_actual && parseFloat(form.stock_actual) < 0) {
      alert("El stock no puede ser negativo");
      return false;
    }
    return true;
  };

  /* ============================================================
     6. CRUD - CREAR Y ACTUALIZAR
  ============================================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setProcesando(true);

    try {
      const productoData = {
        nombre: form.nombre.trim(),
        codigo_barra: form.codigo_barra.trim() || null,
        precio: parseFloat(form.precio),
        stock_actual: form.stock_actual ? parseInt(form.stock_actual) : 0,
        stock_minimo: form.stock_minimo ? parseInt(form.stock_minimo) : 0,
        activo: 1,
      };

      if (modoEdicion && productoActual) {
        await updateProducto(productoActual.id, productoData);
        alert("✅ Producto actualizado con éxito");
      } else {
        await createProducto(productoData);
        alert("✅ Producto creado con éxito");
      }

      cerrarModal();
      await cargarProductos();
    } catch (error: any) {
      console.error(error);
      alert(`❌ Error: ${error.message || "No se pudo guardar el producto"}`);
    } finally {
      setProcesando(false);
    }
  };

  /* ============================================================
     7. CRUD - ELIMINAR
  ============================================================ */
  const confirmarEliminacion = (producto: Producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  const handleEliminar = async () => {
    if (!productoAEliminar) return;

    setProcesando(true);

    try {
      await deleteProducto(productoAEliminar.id);
      alert("✅ Producto eliminado con éxito");
      setShowDeleteModal(false);
      setProductoAEliminar(null);
      await cargarProductos();
    } catch (error: any) {
      console.error(error);
      alert(`❌ Error: ${error.message || "No se pudo eliminar el producto"}`);
    } finally {
      setProcesando(false);
    }
  };

  /* ============================================================
     8. AJUSTE RÁPIDO DE STOCK
  ============================================================ */
  const ajustarStock = async (producto: Producto, cantidad: number) => {
    const nuevoStock = producto.stock_actual + cantidad;

    if (nuevoStock < 0) {
      alert("❌ El stock no puede ser negativo");
      return;
    }

    try {
      await updateProducto(producto.id, {
        ...producto,
        stock_actual: nuevoStock,
      });
      await cargarProductos();
    } catch (error: any) {
      console.error(error);
      alert(`❌ Error al ajustar stock: ${error.message}`);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="inventario-container">
      {/* HEADER CON ESTADÍSTICAS */}
      <div className="inventario-header">
        <div className="header-title">
          <h1>Gestión de Inventario</h1>
          <p>Administra todos tus productos y controla el stock</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            <div>
              <span className="stat-label">Total Productos</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="stat-card warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <span className="stat-label">Stock Crítico</span>
              <span className="stat-value">{stats.critico}</span>
            </div>
          </div>

          <div className="stat-card success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div>
              <span className="stat-label">Valor Inventario</span>
              <span className="stat-value">${stats.valorTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIONES */}
      <div className="actions-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${filtroStock === "todos" ? "active" : ""}`}
            onClick={() => setFiltroStock("todos")}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${filtroStock === "critico" ? "active" : ""}`}
            onClick={() => setFiltroStock("critico")}
          >
            Crítico
          </button>
          <button
            className={`filter-btn ${filtroStock === "bajo" ? "active" : ""}`}
            onClick={() => setFiltroStock("bajo")}
          >
            Bajo
          </button>
          <button
            className={`filter-btn ${filtroStock === "normal" ? "active" : ""}`}
            onClick={() => setFiltroStock("normal")}
          >
            Normal
          </button>
        </div>

        <button className="btn-primary" onClick={abrirModalNuevo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando inventario...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>No se encontraron productos</h3>
            <p>Intenta con otros criterios de búsqueda o agrega un nuevo producto</p>
          </div>
        ) : (
          <table className="productos-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => {
                const stockPorcentaje = (producto.stock_actual / producto.stock_minimo) * 100;
                let estadoStock = "normal";
                if (producto.stock_actual < producto.stock_minimo) {
                  estadoStock = "critico";
                } else if (producto.stock_actual < producto.stock_minimo * 2) {
                  estadoStock = "bajo";
                }

                return (
                  <tr key={producto.id}>
                    <td className="codigo-cell">{producto.codigo_barra || "N/A"}</td>
                    <td className="producto-cell">
                      <span className="producto-nombre">{producto.nombre}</span>
                    </td>
                    <td className="precio-cell">${producto.precio.toLocaleString()}</td>
                    <td className="stock-cell">
                      <div className="stock-controls">
                        <button
                          className="stock-btn"
                          onClick={() => ajustarStock(producto, -1)}
                          title="Reducir stock"
                        >
                          −
                        </button>
                        <span className={`stock-value ${estadoStock}`}>
                          {producto.stock_actual}
                        </span>
                        <button
                          className="stock-btn"
                          onClick={() => ajustarStock(producto, 1)}
                          title="Aumentar stock"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="minimo-cell">{producto.stock_minimo}</td>
                    <td className="estado-cell">
                      <span className={`badge badge-${estadoStock}`}>
                        {estadoStock === "critico" && "Crítico"}
                        {estadoStock === "bajo" && "Bajo"}
                        {estadoStock === "normal" && "Normal"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => abrirModalEditar(producto)}
                        title="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => confirmarEliminacion(producto)}
                        title="Eliminar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CREAR/EDITAR */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modoEdicion ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button className="close-btn" onClick={cerrarModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Coca Cola 500ml"
                  required
                />
              </div>

              <div className="form-group">
                <label>Código de Barras</label>
                <input
                  type="text"
                  name="codigo_barra"
                  value={form.codigo_barra}
                  onChange={handleInputChange}
                  placeholder="Ej: 7790001234567"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    name="precio"
                    value={form.precio}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock Actual</label>
                  <input
                    type="number"
                    name="stock_actual"
                    value={form.stock_actual}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={form.stock_minimo}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={procesando}>
                  {procesando ? "Guardando..." : modoEdicion ? "Actualizar" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {showDeleteModal && productoAEliminar && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
            </div>

            <div className="modal-body">
              <div className="warning-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p>
                ¿Estás seguro de que deseas eliminar el producto{" "}
                <strong>{productoAEliminar.nombre}</strong>?
              </p>
              <p className="warning-text">Esta acción no se puede deshacer.</p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleEliminar}
                disabled={procesando}
              >
                {procesando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
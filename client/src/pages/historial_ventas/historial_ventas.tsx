import React, { useEffect, useState, useCallback } from "react";
import {
  getVentas,
  getDetallesByVentaId,
  deleteVenta,
} from "../../services/ventas";
import "./historial_ventas.css";

// --- INTERFACES ---
interface Venta {
  id: number;
  total: number;
  fecha: string; // Formato ISO del servidor
  usuario_id: number;
}

interface DetalleVenta {
  id: number;
  producto_id: number;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

const Historial = () => {
  // Estados de datos
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ventasFiltradas, setVentasFiltradas] = useState<Venta[]>([]);
  const [detallesVenta, setDetallesVenta] = useState<DetalleVenta[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Estados de Filtro de Fecha (Inicializado en "Hoy")
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0]);

  // Estados del modal
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);

  // Estados de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState<Venta | null>(null);
  const [procesando, setProcesando] = useState(false);

  /* ============================================================
     1. CARGA DE DATOS
  ============================================================ */
  const cargarVentas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVentas();
      
      // Ordenar por fecha descendente (más reciente primero)
      const ventasOrdenadas = data.sort((a: Venta, b: Venta) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      
      setVentas(ventasOrdenadas);
      // No seteamos ventasFiltradas aquí directamente, dejamos que el useEffect de filtros lo haga
    } catch (error) {
      console.error("Error cargando ventas:", error);
      alert("Error al cargar el historial de ventas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  /* ============================================================
     2. LÓGICA DE FILTROS (FECHAS Y BÚSQUEDA)
  ============================================================ */
  
  // Función auxiliar para establecer rangos rápidos
  const aplicarRangoRapido = (tipo: "hoy" | "semana" | "mes" | "año" | "todos") => {
    const hoy = new Date();
    const fin = hoy.toISOString().split('T')[0];
    let inicio = "";

    switch (tipo) {
      case "hoy":
        inicio = fin;
        break;
      case "semana":
        const semanaPasada = new Date(hoy);
        semanaPasada.setDate(hoy.getDate() - 7);
        inicio = semanaPasada.toISOString().split('T')[0];
        break;
      case "mes":
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio = primerDiaMes.toISOString().split('T')[0];
        break;
      case "año":
        const primerDiaAno = new Date(hoy.getFullYear(), 0, 1);
        inicio = primerDiaAno.toISOString().split('T')[0];
        break;
      case "todos":
        inicio = "2000-01-01"; // Fecha muy antigua para traer todo
        break;
    }
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  // Efecto que aplica los filtros cuando cambian las fechas, la búsqueda o la data original
  useEffect(() => {
    let resultado = ventas;

    // 1. Filtro por Fechas
    if (fechaInicio && fechaFin) {
      // Ajustamos hora para asegurar comparación inclusiva correcta
      // Inicio: 00:00:00 del día seleccionado
      // Fin: 23:59:59 del día seleccionado (o usamos comparación de strings simples YYYY-MM-DD)
      
      resultado = resultado.filter(v => {
        const fechaVentaStr = new Date(v.fecha).toISOString().split('T')[0];
        return fechaVentaStr >= fechaInicio && fechaVentaStr <= fechaFin;
      });
    }

    // 2. Filtro por Búsqueda (ID)
    if (busqueda) {
      resultado = resultado.filter(v => 
        v.id.toString().includes(busqueda)
      );
    }

    setVentasFiltradas(resultado);
  }, [busqueda, fechaInicio, fechaFin, ventas]);

  /* ============================================================
     3. ESTADÍSTICAS (Recalculadas sobre ventasFiltradas)
  ============================================================ */
  const stats = {
    totalVentas: ventasFiltradas.length,
    // Aseguramos que v.total sea número
    totalRecaudado: ventasFiltradas.reduce((acc, v) => acc + Number(v.total), 0)
  };

  /* ============================================================
     4. MANEJO DE DETALLES Y ELIMINACIÓN
  ============================================================ */
  const verDetalles = async (venta: Venta) => {
    setVentaSeleccionada(venta);
    setShowDetallesModal(true);
    setLoadingDetalles(true);
    try {
      const detalles = await getDetallesByVentaId(venta.id);
      setDetallesVenta(detalles);
    } catch (error) {
      console.error(error);
      setDetallesVenta([]);
    } finally {
      setLoadingDetalles(false);
    }
  };

  const cerrarDetalles = () => {
    setShowDetallesModal(false);
    setVentaSeleccionada(null);
    setDetallesVenta([]);
  };

  const confirmarEliminacion = (venta: Venta) => {
    setVentaAEliminar(venta);
    setShowDeleteModal(true);
  };

  const handleEliminar = async () => {
    if (!ventaAEliminar) return;
    setProcesando(true);
    try {
      await deleteVenta(ventaAEliminar.id);
      alert("✅ Venta eliminada con éxito");
      setShowDeleteModal(false);
      setVentaAEliminar(null);
      await cargarVentas();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setProcesando(false);
    }
  };

  /* ============================================================
     5. IMPRESIÓN Y EXPORTACIÓN
  ============================================================ */
/* ============================================================
     5. IMPRIMIR TICKET DE VENTA
  ============================================================ */
  const imprimirTicket = (venta: Venta) => {
    if (detallesVenta.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fecha = new Date(venta.fecha);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Venta #${venta.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .ticket-header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .ticket-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .ticket-info {
              font-size: 11px;
              margin-bottom: 15px;
            }
            .ticket-items {
              margin-bottom: 15px;
            }
            .ticket-item {
              margin-bottom: 8px;
              font-size: 12px;
            }
            .item-name {
              font-weight: bold;
            }
            .item-detail {
              display: flex;
              justify-content: space-between;
              margin-top: 2px;
            }
            .ticket-divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .ticket-total {
              font-size: 14px;
              font-weight: bold;
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .ticket-footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px dashed #000;
              font-size: 11px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-header">
            <div class="ticket-title">STOCKCENT</div>
            <div>Ticket de Venta</div>
          </div>
          <div class="ticket-info">
            <div>Venta #${venta.id}</div>
            <div>Fecha: ${fecha.toLocaleDateString('es-AR')}</div>
            <div>Hora: ${fecha.toLocaleTimeString('es-AR')}</div>
          </div>
          <div class="ticket-items">
            ${detallesVenta.map(item => `
              <div class="ticket-item">
                <div class="item-name">${item.producto}</div>
                <div class="item-detail">
                  <span>${item.cantidad} x $${item.precio_unitario.toLocaleString()}</span>
                  <span>$${item.subtotal.toLocaleString()}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="ticket-divider"></div>
          <div class="ticket-total">
            <span>TOTAL:</span>
            <span>$${venta.total.toLocaleString()}</span>
          </div>
          <div class="ticket-footer">
            <div>¡Gracias por su compra!</div>
            <div>www.stockcent.com</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };


  const exportarCSV = () => {
    if (ventasFiltradas.length === 0) return alert("Nada para exportar");
    const headers = ["ID", "Fecha", "Hora", "Total"];
    const rows = ventasFiltradas.map(v => {
      const f = new Date(v.fecha);
      return [v.id, f.toLocaleDateString(), f.toLocaleTimeString(), v.total];
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ventas_${fechaInicio}_${fechaFin}.csv`;
    link.click();
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="historial-container">
      {/* HEADER CON ESTADÍSTICAS FILTRADAS */}
      <div className="historial-header">
        <div className="header-title">
          <h1>Historial de Ventas</h1>
          <p>
            Ventas desde <b>{new Date(fechaInicio).toLocaleDateString()}</b> hasta <b>{new Date(fechaFin).toLocaleDateString()}</b>
          </p>
        </div>

        <div className="stats-cards" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {/* TARJETA 1: TOTAL VENTAS (CANTIDAD) */}
          <div className="stat-card primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
            </svg>
            <div>
              <span className="stat-label">Ventas Realizadas</span>
              <span className="stat-value">{stats.totalVentas}</span>
            </div>
          </div>

          {/* TARJETA 2: TOTAL RECAUDADO (DINERO) */}
          <div className="stat-card success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div>
              <span className="stat-label">Total Recaudado</span>
              <span className="stat-value">${stats.totalRecaudado.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIONES Y FILTROS */}
      <div className="actions-bar" style={{ flexWrap: "wrap", gap: "10px" }}>
        {/* INPUTS DE FECHA PARA CONSULTA PERSONALIZADA */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input 
                type="date" 
                className="filter-btn" 
                style={{ padding: "8px", border: "1px solid #ddd", background: "white" }}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
            />
            <span style={{ color: "#666" }}>a</span>
            <input 
                type="date" 
                className="filter-btn" 
                style={{ padding: "8px", border: "1px solid #ddd", background: "white" }}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
            />
        </div>

        {/* BÚSQUEDA POR ID */}
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* BOTONES DE RANGO RÁPIDO */}
        <div className="filter-group">
          <button className="filter-btn" onClick={() => aplicarRangoRapido("hoy")}>Hoy</button>
          <button className="filter-btn" onClick={() => aplicarRangoRapido("mes")}>Este Mes</button>
          <button className="filter-btn" onClick={() => aplicarRangoRapido("todos")}>Todas</button>
        </div>

        <button className="btn-export" onClick={exportarCSV}>
          Exportar CSV
        </button>
      </div>

      {/* TABLA DE VENTAS CON SCROLL */}
      {/* Añadimos estilos inline para garantizar el scroll sin tocar el archivo CSS */}
      <div className="table-container" style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div><p>Cargando...</p>
          </div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="empty-state">
            <h3>No se encontraron ventas</h3>
            <p>Prueba cambiando el rango de fechas</p>
          </div>
        ) : (
          <table className="ventas-table">
            <thead style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map((venta) => {
                const fecha = new Date(venta.fecha);
                return (
                  <tr key={venta.id}>
                    <td className="id-cell">#{venta.id}</td>
                    <td>{fecha.toLocaleDateString('es-AR')}</td>
                    <td>{fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="total-cell" style={{ fontWeight: "bold", color: "#10b981" }}>
                        ${venta.total.toLocaleString()}
                    </td>
                    <td className="actions-cell">
                      <button className="action-btn view" onClick={() => verDetalles(venta)} title="Ver detalles">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="action-btn delete" onClick={() => confirmarEliminacion(venta)} title="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DETALLES (Sin cambios mayores, solo uso de datos) */}
      {showDetallesModal && ventaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarDetalles}>
          <div className="modal-box modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Venta #{ventaSeleccionada.id}</h2>
              <button className="close-btn" onClick={cerrarDetalles}>✕</button>
            </div>
            <div className="modal-body">
              {loadingDetalles ? <p>Cargando...</p> : (
                <table className="detalles-table">
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>$$</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {detallesVenta.map(d => (
                      <tr key={d.id}>
                        <td className="producto-cell" >{d.producto}</td><td className="cantidad-cell">{d.cantidad}</td><td className="precio-cell">${d.precio_unitario}</td><td className="subtotal-cell">${d.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="detalle-footer">
                    <div className="total-detalle">
                      <span>Total:</span>
                      <span className="total-amount">${ventaSeleccionada.total.toLocaleString()}</span>
                    </div>
                  </div>
            </div>
            <div className="modal-actions">
              <button className="btn-print" onClick={() => imprimirTicket(ventaSeleccionada)}>Imprimir</button>
              <button className="btn-secondary" onClick={cerrarDetalles}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && ventaAEliminar && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Eliminar Venta</h2></div>
            <div className="modal-body">
              <p>¿Eliminar venta <strong>#{ventaAEliminar.id}</strong>? Esta acción es irreversible.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleEliminar} disabled={procesando}>
                {procesando ? "..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historial;
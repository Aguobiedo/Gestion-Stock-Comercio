import React, { useEffect, useState, useCallback, useRef } from "react";
// Importamos los servicios de Productos
import { 
  getProductos, 
  getProductoByBarCode 
} from "../../services/productos";
// Importamos los servicios de Ventas
import { 
  createVenta, 
  createDetalleVenta, 
  getTotalVentasDelDia 
} from "../../services/ventas";

import "./home.css";

// --- SISTEMA DE SONIDOS UNIFICADO ---
const playSound = (type: 'scan' | 'error' | 'success' | 'delete' | 'click') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const now = ctx.currentTime;

  switch (type) {
    case 'scan': 
    case 'click': // <--- AHORA CLICK Y SCAN COMPARTEN EL MISMO SONIDO
      // EL CLÁSICO "BEEP" DE LECTOR LÁSER (Para clicks y escaneos)
      const oscScan = ctx.createOscillator();
      const gainScan = ctx.createGain();
      oscScan.connect(gainScan);
      gainScan.connect(ctx.destination);
      
      oscScan.type = 'square'; // Onda cuadrada (sonido "digital")
      oscScan.frequency.setValueAtTime(1750, now); // Frecuencia muy aguda
      
      gainScan.gain.setValueAtTime(0.1, now);
      gainScan.gain.setValueAtTime(0.1, now + 0.08);
      gainScan.gain.linearRampToValueAtTime(0, now + 0.081); // Corte seco
      
      oscScan.start(now);
      oscScan.stop(now + 0.1);
      break;

    case 'error': 
      // BUZZER INDUSTRIAL (DOBLE ZUMBIDO GRAVE)
      const oscErr = ctx.createOscillator();
      const gainErr = ctx.createGain();
      oscErr.connect(gainErr);
      gainErr.connect(ctx.destination);
      
      oscErr.type = 'sawtooth';
      oscErr.frequency.setValueAtTime(120, now);

      gainErr.gain.setValueAtTime(0.2, now);
      gainErr.gain.setValueAtTime(0.2, now + 0.1);
      gainErr.gain.setValueAtTime(0, now + 0.11);
      
      gainErr.gain.setValueAtTime(0.2, now + 0.2);
      gainErr.gain.linearRampToValueAtTime(0, now + 0.4);

      oscErr.start(now);
      oscErr.stop(now + 0.5);
      break;

    case 'delete': 
      // SONIDO DE "VACÍO" / BORRADO
      const oscDel = ctx.createOscillator();
      const gainDel = ctx.createGain();
      oscDel.connect(gainDel);
      gainDel.connect(ctx.destination);
      
      oscDel.type = 'triangle';
      oscDel.frequency.setValueAtTime(300, now);
      oscDel.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      
      gainDel.gain.setValueAtTime(0.15, now);
      gainDel.gain.linearRampToValueAtTime(0, now + 0.2);
      
      oscDel.start(now);
      oscDel.stop(now + 0.25);
      break;

    case 'success': 
      // "CHA-CHING" - CAJA REGISTRADORA ANTIGUA
      
      // 1. Apertura del cajón
      const oscDrawer = ctx.createOscillator();
      const gainDrawer = ctx.createGain();
      oscDrawer.connect(gainDrawer);
      gainDrawer.connect(ctx.destination);
      oscDrawer.type = 'sawtooth';
      oscDrawer.frequency.setValueAtTime(200, now);
      oscDrawer.frequency.linearRampToValueAtTime(50, now + 0.15);
      gainDrawer.gain.setValueAtTime(0.2, now);
      gainDrawer.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      oscDrawer.start(now);
      oscDrawer.stop(now + 0.2);

      // 2. Campanillas
      const oscBell1 = ctx.createOscillator();
      const gainBell1 = ctx.createGain();
      oscBell1.connect(gainBell1);
      gainBell1.connect(ctx.destination);
      oscBell1.type = 'sine';
      oscBell1.frequency.setValueAtTime(2000, now + 0.05);
      gainBell1.gain.setValueAtTime(0, now);
      gainBell1.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gainBell1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      oscBell1.start(now);
      oscBell1.stop(now + 0.8);

      const oscBell2 = ctx.createOscillator();
      const gainBell2 = ctx.createGain();
      oscBell2.connect(gainBell2);
      gainBell2.connect(ctx.destination);
      oscBell2.type = 'sine';
      oscBell2.frequency.setValueAtTime(3500, now + 0.08);
      gainBell2.gain.setValueAtTime(0, now);
      gainBell2.gain.linearRampToValueAtTime(0.05, now + 0.08);
      gainBell2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      oscBell2.start(now);
      oscBell2.stop(now + 0.6);
      break;
  }
};

// --- INTERFACES ---
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock_actual: number;
  codigo_barras: string;
  stock_minimo?: number;
}

interface ItemCarrito extends Producto {
  cantidad: number;
}

interface ResumenVenta {
  id: number;
  items: ItemCarrito[];
  subtotal: number;
  total: number;
  fecha: Date;
}

const Home = () => {
  const ticketRef = useRef<HTMLDivElement>(null);

  // Estados de datos
  const [ventasDia, setVentasDia] = useState(0);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  // Estados de UI y carga
  const [loading, setLoading] = useState(true);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  
  // Estados del POS
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [procesandoBarcode, setProcesandoBarcode] = useState(false);
  
  // Estados del popup
  const [showResumen, setShowResumen] = useState(false);
  const [resumenVenta, setResumenVenta] = useState<ResumenVenta | null>(null);

  /* ============================================================
     1. FUNCIONES DE CARGA DE DATOS
  ============================================================ */
  const cargarDatos = useCallback(async () => {
    try {
      const [productosData, totalDiaData] = await Promise.all([
        getProductos(),
        getTotalVentasDelDia()
      ]);

      setProductos(productosData);
      setVentasDia(totalDiaData.total || 0); 
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /* ============================================================
     2. CÁLCULOS
  ============================================================ */
  const totalVenta = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  const stockCriticoCount = productos.filter(
    (p) => p.stock_actual < (p.stock_minimo ?? 5)
  ).length;

  /* ============================================================
     3. LÓGICA DEL CARRITO
  ============================================================ */
  const agregarProducto = (producto: Producto) => {
    if (producto.stock_actual <= 0) {
      playSound('error'); 
      alert("❌ Sin stock disponible");
      return;
    }

    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);

      if (existe) {
        if (existe.cantidad >= producto.stock_actual) {
            playSound('error'); 
            alert("⚠️ Stock máximo alcanzado para este producto");
            return prev;
        }
        
        playSound('scan'); 
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }

      playSound('scan'); 
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const modificarCantidad = (id: number, delta: number) => {
    playSound('click'); // Ahora suena igual que scan
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nueva = item.cantidad + delta;
            const prod = productos.find((p) => p.id === id);

            if (prod && nueva > 0 && nueva <= prod.stock_actual) {
              return { ...item, cantidad: nueva };
            }
          }
          return item;
        })
        .filter((i) => i.cantidad > 0)
    );
  };

  const eliminarItem = (id: number) => {
    playSound('delete');
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  /* ============================================================
     4. MANEJO DE CÓDIGO DE BARRAS
  ============================================================ */
  const manejarBarcode = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    const barcode = busqueda.trim();
    if (!barcode || procesandoBarcode) return;

    try {
      setProcesandoBarcode(true);
      const producto = await getProductoByBarCode(barcode);
      agregarProducto(producto); // Esto ya dispara el sonido 'scan'
      setBusqueda("");
    } catch (error: any) {
      playSound('error'); 
      alert(error.message || "Producto no encontrado");
    } finally {
      setProcesandoBarcode(false);
    }
  };

  /* ============================================================
     5. FINALIZAR VENTA
  ============================================================ */
  const finalizarVenta = async () => {
    if (carrito.length === 0) return;

    setProcesandoVenta(true);

    try {
      const ventaResponse = await createVenta(totalVenta);
      const ventaId = ventaResponse.id;

      if (!ventaId) throw new Error("No se obtuvo ID de venta");

      const promesasDetalles = carrito.map((item) => {
        return createDetalleVenta(ventaId, {
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
        });
      });

      await Promise.all(promesasDetalles);

      const resumen: ResumenVenta = {
        id: ventaId,
        items: [...carrito],
        subtotal: totalVenta,
        total: totalVenta,
        fecha: new Date()
      };

      playSound('success'); 
      setResumenVenta(resumen);
      setShowResumen(true);
      
      setCarrito([]);
      setBusqueda("");
      
      setLoading(true);
      await cargarDatos(); 

    } catch (error: any) {
      console.error(error);
      playSound('error');
      alert(`❌ Error al procesar la venta: ${error.message || "Desconocido"}`);
    } finally {
      setProcesandoVenta(false);
    }
  };

  /* ============================================================
     6. IMPRIMIR TICKET
  ============================================================ */
  const imprimirTicket = () => {
    if (!ticketRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const ticketContent = ticketRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Venta #${resumenVenta?.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .ticket-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .ticket-title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .ticket-info { font-size: 11px; margin-bottom: 15px; }
            .ticket-items { margin-bottom: 15px; }
            .ticket-item { margin-bottom: 8px; font-size: 12px; }
            .item-name { font-weight: bold; }
            .item-detail { display: flex; justify-content: space-between; margin-top: 2px; }
            .ticket-divider { border-top: 1px dashed #000; margin: 10px 0; }
            .ticket-total { font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; }
            .ticket-footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #000; font-size: 11px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${ticketContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const cerrarResumen = () => {
    setShowResumen(false);
    setResumenVenta(null);
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="pos-container">
      <header className="top-bar">
        <div className="stats-group">
          <div className="stat-pill success">
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div>
              <div className="pill-label">Ventas Hoy</div>
              <div className="pill-value">${ventasDia.toLocaleString("es-AR")}</div>
            </div>
          </div>
          <div className={`stat-pill ${stockCriticoCount > 0 ? "danger" : "neutral"}`}>
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div className="pill-label">Stock Crítico</div>
              <div className="pill-value">{stockCriticoCount}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="workspace">
        {/* CATALOGO DE PRODUCTOS */}
        <section className="catalog-section">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Escanear código de barras o buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={manejarBarcode}
              disabled={procesandoBarcode || procesandoVenta}
              autoFocus
            />
          </div>

          <div className="products-grid">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando inventario...</p>
              </div>
            ) : (
              productos
                .filter((p) =>
                  p.nombre.toLowerCase().includes(busqueda.toLowerCase())
                )
                .map((prod) => (
                  <button
                    key={prod.id}
                    disabled={prod.stock_actual <= 0 || procesandoVenta}
                    className={`product-card ${prod.stock_actual === 0 ? 'no-stock' : ''}`}
                    onClick={() => agregarProducto(prod)}
                  >
                    <div className="prod-name">{prod.nombre}</div>
                    <div className="prod-price">${prod.precio.toLocaleString()}</div>
                    <div className={`prod-stock ${prod.stock_actual < (prod.stock_minimo || 5) ? 'low' : ''}`}>
                      Stock: {prod.stock_actual}
                    </div>
                  </button>
                ))
            )}
          </div>
        </section>

        {/* CHECKOUT / CARRITO */}
        <section className="checkout-section">
          <div className="cart-card">
            <div className="cart-header">
                <h3>Orden Actual</h3>
                {carrito.length > 0 && (
                    <button className="clear-btn" onClick={() => {
                        playSound('delete');
                        setCarrito([]);
                    }}>
                        Limpiar
                    </button>
                )}
            </div>

            <div className="cart-items-container">
              {carrito.length === 0 ? (
                <div className="empty-cart-msg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <p>Carrito vacío</p>
                  <span>Agrega productos para comenzar</span>
                </div>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <span className="item-name">{item.nombre}</span>
                      <span className="item-price-unit">${item.precio.toLocaleString()} × {item.cantidad}</span>
                    </div>
                    <div className="item-subtotal">
                        ${(item.precio * item.cantidad).toLocaleString()}
                    </div>
                    <div className="item-actions">
                      <div className="item-controls">
                        <button onClick={() => modificarCantidad(item.id, -1)}>−</button>
                        <span className="item-qty">{item.cantidad}</span>
                        <button onClick={() => modificarCantidad(item.id, 1)} disabled={item.cantidad >= item.stock_actual}>+</button>
                      </div>
                      <button className="delete-btn" onClick={() => eliminarItem(item.id)} title="Eliminar producto">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <div className="summary-row">
                  <span>Total Items:</span>
                  <span>{carrito.reduce((acc, i) => acc + i.cantidad, 0)}</span>
              </div>
              <div className="summary-total">
                <span>TOTAL:</span>
                <span>${totalVenta.toLocaleString()}</span>
              </div>

              <button
                disabled={carrito.length === 0 || procesandoVenta}
                onClick={finalizarVenta}
                className="pay-button"
              >
                {procesandoVenta ? (
                  <>
                    <div className="button-spinner"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Procesar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* POPUP RESUMEN DE VENTA */}
      {showResumen && resumenVenta && (
        <div className="modal-overlay" onClick={cerrarResumen}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2>¡Venta Realizada con Éxito!</h2>
              <p>Venta #{resumenVenta.id}</p>
            </div>

            <div className="modal-body">
              {/* Ticket para imprimir (oculto visualmente) */}
              <div ref={ticketRef} style={{ display: 'none' }}>
                <div className="ticket-header">
                  <div className="ticket-title">STOCKCENT</div>
                  <div>Ticket de Venta</div>
                </div>
                <div className="ticket-info">
                  <div>Venta #{resumenVenta.id}</div>
                  <div>Fecha: {resumenVenta.fecha.toLocaleDateString('es-AR')}</div>
                  <div>Hora: {resumenVenta.fecha.toLocaleTimeString('es-AR')}</div>
                </div>
                <div className="ticket-items">
                  {resumenVenta.items.map((item) => (
                    <div key={item.id} className="ticket-item">
                      <div className="item-name">{item.nombre}</div>
                      <div className="item-detail">
                        <span>{item.cantidad} x ${item.precio.toLocaleString()}</span>
                        <span>${(item.cantidad * item.precio).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ticket-divider"></div>
                <div className="ticket-total">
                  <span>TOTAL:</span>
                  <span>${resumenVenta.total.toLocaleString()}</span>
                </div>
                <div className="ticket-footer">
                  <div>¡Gracias por su compra!</div>
                  <div>www.stockcent.com</div>
                </div>
              </div>

              {/* Resumen visible en modal */}
              <div className="resumen-items">
                {resumenVenta.items.map((item) => (
                  <div key={item.id} className="resumen-item">
                    <div className="resumen-item-info">
                      <span className="resumen-item-name">{item.nombre}</span>
                      <span className="resumen-item-qty">{item.cantidad} × ${item.precio.toLocaleString()}</span>
                    </div>
                    <span className="resumen-item-total">${(item.cantidad * item.precio).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="resumen-total">
                <span>Total Pagado:</span>
                <span>${resumenVenta.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-print" onClick={imprimirTicket}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimir Ticket
              </button>
              <button className="btn-close" onClick={cerrarResumen}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
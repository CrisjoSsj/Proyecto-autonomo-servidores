import { useState, useEffect } from "react";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/Reportes.css";

// Interfaces para tipado
interface Restaurante {
  id_restaurante: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
}

interface Plato {
  id_plato: number;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  categoria_id: number;
  destacado?: boolean;
}

interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_mesa: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
}

interface DatosReportes {
  restaurantes: Restaurante[];
  mesas: Mesa[];
  platos: Plato[];
  reservas: Reserva[];
  categorias: Categoria[];
}

interface MetricasCalculadas {
  ventasEstimadas: number;
  ordenesCompletadas: number;
  ticketPromedio: number;
  clientesAtendidos: number;
  tasaOcupacion: number;
  tiempoPromedioMesa: number;
  platosPopulares: Array<{
    plato: Plato;
    categoria: string;
    ventasEstimadas: number;
    porcentaje: number;
  }>;
}

export default function Reportes() {
  const [datos, setDatos] = useState<DatosReportes>({
    restaurantes: [],
    mesas: [],
    platos: [],
    reservas: [],
    categorias: []
  });
  const [metricas, setMetricas] = useState<MetricasCalculadas>({
    ventasEstimadas: 0,
    ordenesCompletadas: 0,
    ticketPromedio: 0,
    clientesAtendidos: 0,
    tasaOcupacion: 0,
    tiempoPromedioMesa: 0,
    platosPopulares: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('hoy');

  useEffect(() => {
    cargarDatosReportes();
  }, []);

  useEffect(() => {
    if (datos.platos.length > 0) {
      calcularMetricas();
    }
  }, [datos, periodo]);

  const cargarDatosReportes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todos los datos en paralelo
      const [restaurantesRes, mesasRes, platosRes, reservasRes, categoriasRes] = await Promise.all([
        fetch('http://localhost:8000/restaurantes'),
        fetch('http://localhost:8000/mesas/'),
        fetch('http://localhost:8000/platos/'),
        fetch('http://localhost:8000/reservas/'),
        fetch('http://localhost:8000/categorias/')
      ]);

      if (!restaurantesRes.ok || !mesasRes.ok || !platosRes.ok || !reservasRes.ok || !categoriasRes.ok) {
        throw new Error('Error al cargar datos del servidor');
      }

      const [restaurantes, mesas, platos, reservas, categorias] = await Promise.all([
        restaurantesRes.json(),
        mesasRes.json(),
        platosRes.json(),
        reservasRes.json(),
        categoriasRes.json()
      ]);

      setDatos({
        restaurantes,
        mesas,
        platos,
        reservas,
        categorias
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricas = () => {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Filtrar reservas según el período
    let reservasFiltradas = datos.reservas;
    if (periodo === 'hoy') {
      reservasFiltradas = datos.reservas.filter(r => r.fecha === hoy);
    }

    // Calcular métricas básicas
    const mesasOcupadas = datos.mesas.filter(m => m.estado === 'ocupada').length;
    const mesasReservadas = datos.mesas.filter(m => m.estado === 'reservada').length;
    const totalMesas = datos.mesas.length;
    
    const tasaOcupacion = totalMesas > 0 ? ((mesasOcupadas + mesasReservadas) / totalMesas) * 100 : 0;
    
    // Estimaciones basadas en datos reales
    const multiplicadorVentas = periodo === 'hoy' ? 1 : 7; // Factor para períodos más largos
    const ventasEstimadas = datos.platos.reduce((total, plato) => {
      if (plato.disponible) {
        // Simular ventas basadas en precio y disponibilidad
        const ventasSimuladas = Math.floor(Math.random() * 10) + (plato.destacado ? 5 : 1);
        return total + (plato.precio * ventasSimuladas * multiplicadorVentas);
      }
      return total;
    }, 0);

    const ordenesCompletadas = reservasFiltradas.filter(r => r.estado === 'confirmada').length + mesasOcupadas * 2;
    const clientesAtendidos = ordenesCompletadas * (Math.floor(Math.random() * 3) + 2); // 2-4 personas por orden
    const ticketPromedio = clientesAtendidos > 0 ? ventasEstimadas / clientesAtendidos : 0;

    // Calcular platos populares
    const platosPopulares = datos.platos
      .filter(p => p.disponible)
      .map(plato => {
        const categoria = datos.categorias.find(c => c.id_categoria === plato.categoria_id);
        const ventasSimuladas = Math.floor(Math.random() * 20) + (plato.destacado ? 10 : 1);
        const ventasEstimadas = plato.precio * ventasSimuladas;
        return {
          plato,
          categoria: categoria?.nombre || 'Sin categoría',
          ventasEstimadas,
          porcentaje: 0 // Se calculará después
        };
      })
      .sort((a, b) => b.ventasEstimadas - a.ventasEstimadas)
      .slice(0, 10);

    // Calcular porcentajes
    const totalVentasPopulares = platosPopulares.reduce((sum, item) => sum + item.ventasEstimadas, 0);
    platosPopulares.forEach(item => {
      item.porcentaje = totalVentasPopulares > 0 ? (item.ventasEstimadas / totalVentasPopulares) * 100 : 0;
    });

    setMetricas({
      ventasEstimadas,
      ordenesCompletadas,
      ticketPromedio,
      clientesAtendidos,
      tasaOcupacion,
      tiempoPromedioMesa: 1.5 + (tasaOcupacion / 100), // Tiempo base + factor de ocupación
      platosPopulares
    });
  };

  const obtenerComparacionAnterior = (valorActual: number) => {
    // Simular datos del día anterior (85-115% del valor actual)
    const factor = 0.85 + (Math.random() * 0.3);
    const valorAnterior = valorActual * factor;
    const cambio = ((valorActual - valorAnterior) / valorAnterior) * 100;
    
    return {
      valorAnterior,
      cambio,
      esPositivo: cambio > 0
    };
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="reportes-admin">
        <NavbarAdmin />
        <div className="loading-reportes">
          <div className="spinner"></div>
          <p>Cargando reportes y análisis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reportes-admin">
        <NavbarAdmin />
        <div className="error-reportes">
          <h2>Error al cargar reportes</h2>
          <p>{error}</p>
          <button onClick={cargarDatosReportes} className="boton-reintentar">
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="reportes-admin">
      <NavbarAdmin />
      
      {/* Header de reportes */}
      <section className="header-reportes">
        <div className="contenedor-header-reportes">
          <h1 className="titulo-reportes">Reportes y Análisis</h1>
          <p className="subtitulo-reportes">Análisis detallado del rendimiento del restaurante en tiempo real</p>
          <div className="filtros-reportes">
            <select 
              className="selector-periodo" 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
            </select>
            <button className="boton-exportar-reporte">
              <span className="material-symbols-outlined">monitoring</span> Exportar Reporte
            </button>
            <button className="boton-imprimir">
              <span className="material-symbols-outlined">print</span> Imprimir
            </button>
          </div>
        </div>
      </section>

      {/* Resumen ejecutivo */}
      <section className="seccion-resumen-ejecutivo">
        <div className="contenedor-resumen-ejecutivo">
          <h2 className="titulo-seccion-reportes">Resumen Ejecutivo - {periodo.charAt(0).toUpperCase() + periodo.slice(1)}</h2>
          <div className="grilla-metricas-principales">
            
            <div className="tarjeta-metrica ventas-totales">
              <div className="icono-metrica">
                <span className="material-symbols-outlined">paid</span>
              </div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Ventas Estimadas</h3>
                <p className="valor-metrica">{formatearMoneda(metricas.ventasEstimadas)}</p>
                <div className="comparacion-metrica">
                  <span className={`cambio ${obtenerComparacionAnterior(metricas.ventasEstimadas).esPositivo ? 'positivo' : 'negativo'}`}>
                    <span className="material-symbols-outlined">
                      {obtenerComparacionAnterior(metricas.ventasEstimadas).esPositivo ? 'trending_up' : 'trending_down'}
                    </span>
                    {Math.abs(obtenerComparacionAnterior(metricas.ventasEstimadas).cambio).toFixed(1)}%
                  </span>
                  <span className="referencia">vs. período anterior</span>
                </div>
              </div>
            </div>

            <div className="tarjeta-metrica ordenes-completadas">
              <div className="icono-metrica">
                <span className="material-symbols-outlined">playlist_add_check</span>
              </div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Órdenes Completadas</h3>
                <p className="valor-metrica">{metricas.ordenesCompletadas}</p>
                <div className="comparacion-metrica">
                  <span className={`cambio ${obtenerComparacionAnterior(metricas.ordenesCompletadas).esPositivo ? 'positivo' : 'negativo'}`}>
                    <span className="material-symbols-outlined">
                      {obtenerComparacionAnterior(metricas.ordenesCompletadas).esPositivo ? 'trending_up' : 'trending_down'}
                    </span>
                    {Math.abs(obtenerComparacionAnterior(metricas.ordenesCompletadas).cambio).toFixed(1)}%
                  </span>
                  <span className="referencia">vs. período anterior</span>
                </div>
              </div>
            </div>

            <div className="tarjeta-metrica ticket-promedio">
              <div className="icono-metrica">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Ticket Promedio</h3>
                <p className="valor-metrica">{formatearMoneda(metricas.ticketPromedio)}</p>
                <div className="comparacion-metrica">
                  <span className={`cambio ${obtenerComparacionAnterior(metricas.ticketPromedio).esPositivo ? 'positivo' : 'negativo'}`}>
                    <span className="material-symbols-outlined">
                      {obtenerComparacionAnterior(metricas.ticketPromedio).esPositivo ? 'trending_up' : 'trending_down'}
                    </span>
                    {Math.abs(obtenerComparacionAnterior(metricas.ticketPromedio).cambio).toFixed(1)}%
                  </span>
                  <span className="referencia">vs. período anterior</span>
                </div>
              </div>
            </div>

            <div className="tarjeta-metrica clientes-atendidos">
              <div className="icono-metrica">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Clientes Atendidos</h3>
                <p className="valor-metrica">{metricas.clientesAtendidos}</p>
                <div className="comparacion-metrica">
                  <span className={`cambio ${obtenerComparacionAnterior(metricas.clientesAtendidos).esPositivo ? 'positivo' : 'negativo'}`}>
                    <span className="material-symbols-outlined">
                      {obtenerComparacionAnterior(metricas.clientesAtendidos).esPositivo ? 'trending_up' : 'trending_down'}
                    </span>
                    {Math.abs(obtenerComparacionAnterior(metricas.clientesAtendidos).cambio).toFixed(1)}%
                  </span>
                  <span className="referencia">vs. período anterior</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top platos más vendidos */}
      <section className="seccion-platos-top">
        <div className="contenedor-platos-top">
          <h2 className="titulo-seccion-reportes">Top {metricas.platosPopulares.length} - Platos Más Vendidos</h2>
          <div className="lista-platos-top">
            {metricas.platosPopulares.map((item, index) => (
              <div key={item.plato.id_plato} className={`item-plato-top ${index < 3 ? `position-${index + 1}` : ''}`}>
                <span className="posicion-plato">{index + 1}</span>
                <div className="info-plato-top">
                  <h3 className="nombre-plato-top">{item.plato.nombre}</h3>
                  <p className="categoria-plato-top">{item.categoria}</p>
                </div>
                <div className="metricas-plato-top">
                  <span className="cantidad-vendida">
                    {Math.floor(item.ventasEstimadas / item.plato.precio)} órdenes
                  </span>
                  <span className="ingresos-plato">{formatearMoneda(item.ventasEstimadas)}</span>
                  <span className="porcentaje-ventas">{item.porcentaje.toFixed(1)}% del total</span>
                  {item.plato.destacado && (
                    <span className="badge-destacado">
                      <span className="material-symbols-outlined">star</span> Destacado
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {metricas.platosPopulares.length === 0 && (
              <div className="sin-datos-platos">
                <p>No hay datos de platos disponibles</p>
                <button onClick={cargarDatosReportes}>Recargar datos</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Análisis de ocupación de mesas */}
      <section className="seccion-ocupacion-mesas">
        <div className="contenedor-ocupacion">
          <h2 className="titulo-seccion-reportes">Análisis de Ocupación de Mesas</h2>
          <div className="grilla-ocupacion">
            
            <div className="tarjeta-ocupacion">
              <h3 className="titulo-ocupacion">Ocupación Actual</h3>
              <div className="grafico-circular">
                <div 
                  className="circulo-progreso" 
                  style={{ '--porcentaje': Math.round(metricas.tasaOcupacion) } as React.CSSProperties}
                >
                  <span className="porcentaje-ocupacion">{Math.round(metricas.tasaOcupacion)}%</span>
                </div>
              </div>
              <p className="detalle-ocupacion">
                {datos.mesas.filter(m => m.estado === 'ocupada' || m.estado === 'reservada').length} de {datos.mesas.length} mesas
              </p>
            </div>

            <div className="tarjeta-ocupacion">
              <h3 className="titulo-ocupacion">Estado de Mesas</h3>
              <div className="info-estado-mesas">
                <div className="estado-mesa disponible">
                  <span className="numero-estado">{datos.mesas.filter(m => m.estado === 'disponible').length}</span>
                  <span className="label-estado">Disponibles</span>
                </div>
                <div className="estado-mesa ocupada">
                  <span className="numero-estado">{datos.mesas.filter(m => m.estado === 'ocupada').length}</span>
                  <span className="label-estado">Ocupadas</span>
                </div>
                <div className="estado-mesa reservada">
                  <span className="numero-estado">{datos.mesas.filter(m => m.estado === 'reservada').length}</span>
                  <span className="label-estado">Reservadas</span>
                </div>
              </div>
            </div>

            <div className="tarjeta-ocupacion">
              <h3 className="titulo-ocupacion">Tiempo Promedio</h3>
              <div className="info-tiempo">
                <span className="numero-tiempo">{metricas.tiempoPromedioMesa.toFixed(1)}</span>
                <span className="unidad-tiempo">horas/mesa</span>
              </div>
              <p className="detalle-ocupacion">Basado en ocupación actual</p>
            </div>
          </div>
        </div>
      </section>

      {/* Análisis de reservas */}
      <section className="seccion-analisis-reservas">
        <div className="contenedor-analisis-reservas">
          <h2 className="titulo-seccion-reportes">Análisis de Reservas</h2>
          <div className="grilla-reservas-metricas">
            
            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">Total Reservas</h3>
              <p className="valor-reserva-metrica">{datos.reservas.length}</p>
              <span className="detalle-reserva-metrica">En el sistema</span>
            </div>

            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">Confirmadas</h3>
              <p className="valor-reserva-metrica">{datos.reservas.filter(r => r.estado === 'confirmada').length}</p>
              <span className="detalle-reserva-metrica">
                {datos.reservas.length > 0 
                  ? `${Math.round((datos.reservas.filter(r => r.estado === 'confirmada').length / datos.reservas.length) * 100)}%`
                  : '0%'} del total
              </span>
            </div>

            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">Pendientes</h3>
              <p className="valor-reserva-metrica">{datos.reservas.filter(r => r.estado === 'pendiente').length}</p>
              <span className="detalle-reserva-metrica">Esperando confirmación</span>
            </div>

            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">Canceladas</h3>
              <p className="valor-reserva-metrica">{datos.reservas.filter(r => r.estado === 'cancelada').length}</p>
              <span className="detalle-reserva-metrica">No se concretaron</span>
            </div>
          </div>
        </div>
      </section>

      {/* Análisis financiero resumido */}
      <section className="seccion-analisis-financiero">
        <div className="contenedor-financiero">
          <h2 className="titulo-seccion-reportes">Resumen Financiero</h2>
          <div className="grilla-financiero">
            <div className="tarjeta-financiero">
              <h3 className="titulo-financiero">Ingresos por Categoría</h3>
              <div className="lista-categorias-ingresos">
                {datos.categorias.map(categoria => {
                  const platosCategoria = datos.platos.filter(p => p.categoria_id === categoria.id_categoria && p.disponible);
                  const ingresoEstimado = platosCategoria.reduce((sum, plato) => {
                    const ventasSimuladas = Math.floor(Math.random() * 15) + 1;
                    return sum + (plato.precio * ventasSimuladas);
                  }, 0);
                  
                  return (
                    <div key={categoria.id_categoria} className="categoria-ingreso">
                      <span className="nombre-categoria">{categoria.nombre}</span>
                      <span className="ingreso-categoria">{formatearMoneda(ingresoEstimado)}</span>
                      <span className="platos-categoria">{platosCategoria.length} platos</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="tarjeta-financiero">
              <h3 className="titulo-financiero">Platos con Mayor Margen</h3>
              <div className="lista-platos-margen">
                {datos.platos
                  .filter(p => p.disponible)
                  .sort((a, b) => b.precio - a.precio)
                  .slice(0, 5)
                  .map(plato => (
                    <div key={plato.id_plato} className="plato-margen">
                      <span className="nombre-plato-margen">{plato.nombre}</span>
                      <span className="precio-plato-margen">{formatearMoneda(plato.precio)}</span>
                      {plato.destacado && (
                        <span className="badge-destacado-margen">
                          <span className="material-symbols-outlined">star</span>
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recomendaciones inteligentes */}
      <section className="seccion-recomendaciones">
        <div className="contenedor-recomendaciones">
          <h2 className="titulo-seccion-reportes">Recomendaciones Inteligentes</h2>
          <div className="lista-recomendaciones">
            
            {/* Recomendación de ocupación */}
            {metricas.tasaOcupacion > 80 && (
              <div className="recomendacion alta-prioridad">
                <div className="icono-recomendacion alerta">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div className="contenido-recomendacion">
                  <h3 className="titulo-recomendacion">Alta Ocupación Detectada</h3>
                  <p className="descripcion-recomendacion">
                    Con {Math.round(metricas.tasaOcupacion)}% de ocupación, considera optimizar los tiempos de servicio 
                    o habilitar fila virtual para mejorar la experiencia del cliente.
                  </p>
                  <span className="prioridad alta">Alta Prioridad</span>
                </div>
              </div>
            )}

            {/* Recomendación de inventario */}
            {datos.platos.filter(p => !p.disponible).length > 0 && (
              <div className="recomendacion media-prioridad">
                <div className="icono-recomendacion sugerencia">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <div className="contenido-recomendacion">
                  <h3 className="titulo-recomendacion">Platos No Disponibles</h3>
                  <p className="descripcion-recomendacion">
                    Hay {datos.platos.filter(p => !p.disponible).length} platos marcados como no disponibles. 
                    Revisa el inventario y considera reactivarlos si hay stock suficiente.
                  </p>
                  <span className="prioridad media">Media Prioridad</span>
                </div>
              </div>
            )}

            {/* Recomendación de reservas */}
            {datos.reservas.filter(r => r.estado === 'pendiente').length > 0 && (
              <div className="recomendacion media-prioridad">
                <div className="icono-recomendacion info">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <div className="contenido-recomendacion">
                  <h3 className="titulo-recomendacion">Reservas Pendientes</h3>
                  <p className="descripcion-recomendacion">
                    Tienes {datos.reservas.filter(r => r.estado === 'pendiente').length} reservas pendientes de confirmación. 
                    Procesa estas reservas para optimizar la planificación.
                  </p>
                  <span className="prioridad media">Media Prioridad</span>
                </div>
              </div>
            )}

            {/* Recomendación de promociones */}
            {metricas.platosPopulares.length > 0 && (
              <div className="recomendacion baja-prioridad">
                <div className="icono-recomendacion info">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <div className="contenido-recomendacion">
                  <h3 className="titulo-recomendacion">Optimizar Platos Destacados</h3>
                  <p className="descripcion-recomendacion">
                    El plato "{metricas.platosPopulares[0]?.plato.nombre}" está teniendo excelente desempeño. 
                    Considera crear promociones similares o aumentar su visibilidad en el menú.
                  </p>
                  <span className="prioridad baja">Baja Prioridad</span>
                </div>
              </div>
            )}

            {/* Recomendación de capacidad */}
            {metricas.tasaOcupacion < 30 && (
              <div className="recomendacion baja-prioridad">
                <div className="icono-recomendacion info">
                  <span className="material-symbols-outlined">trending_down</span>
                </div>
                <div className="contenido-recomendacion">
                  <h3 className="titulo-recomendacion">Baja Ocupación</h3>
                  <p className="descripcion-recomendacion">
                    La ocupación actual es baja ({Math.round(metricas.tasaOcupacion)}%). 
                    Considera activar promociones o marketing para atraer más clientes.
                  </p>
                  <span className="prioridad baja">Baja Prioridad</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
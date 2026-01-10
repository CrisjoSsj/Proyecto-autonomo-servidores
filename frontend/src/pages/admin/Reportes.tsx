import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/ApiService";
import { downloadReportePDF } from "../../services/GraphQLService";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import type { Mesa, Reserva, PersonaFila, Plato, Categoria } from "../../types";
import "../../css/admin/Reportes.css";

interface MetricasOperacionales {
  mesasDisponibles: number;
  mesasOcupadas: number;
  mesasReservadas: number;
  totalMesas: number;
  tasaOcupacion: number;
  reservasConfirmadas: number;
  reservasPendientes: number;
  reservasRechazadas: number;
  totalReservas: number;
  personasEnCola: number;
  platosDisponibles: number;
  platosNoDisponibles: number;
  tiempoPromedioEspera: number;
}

export default function Reportes() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filaVirtual, setFilaVirtual] = useState<PersonaFila[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metricas, setMetricas] = useState<MetricasOperacionales>({
    mesasDisponibles: 0,
    mesasOcupadas: 0,
    mesasReservadas: 0,
    totalMesas: 0,
    tasaOcupacion: 0,
    reservasConfirmadas: 0,
    reservasPendientes: 0,
    reservasRechazadas: 0,
    totalReservas: 0,
    personasEnCola: 0,
    platosDisponibles: 0,
    platosNoDisponibles: 0,
    tiempoPromedioEspera: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('hoy');

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [mesasData, platosData, reservasData, filaData, categoriasData] = await Promise.all([
        apiService.getMesas(),
        apiService.getPlatos(),
        apiService.getReservas(),
        apiService.getFilaVirtual(),
        apiService.getCategorias()
      ]);

      setMesas(mesasData || []);
      setPlatos(platosData || []);
      setReservas(reservasData || []);
      setFilaVirtual(filaData || []);
      setCategorias(categoriasData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularMetricas = useCallback(() => {
    const hoy = new Date().toISOString().split('T')[0];

    // Métricas de mesas
    const mesasDisponibles = mesas.filter(m => m.estado?.toLowerCase() === 'disponible' || m.estado?.toLowerCase() === 'libre').length;
    const mesasOcupadas = mesas.filter(m => m.estado?.toLowerCase() === 'ocupada').length;
    const mesasReservadas = mesas.filter(m => m.estado?.toLowerCase() === 'reservada').length;
    const totalMesas = mesas.length;
    const tasaOcupacion = totalMesas > 0 ? ((mesasOcupadas + mesasReservadas) / totalMesas) * 100 : 0;

    // Métricas de reservas (filtrar por período)
    let reservasFiltradas = reservas;
    if (periodo === 'hoy') {
      reservasFiltradas = reservas.filter(r => r.fecha === hoy);
    }
    const reservasConfirmadas = reservasFiltradas.filter(r => r.estado?.toLowerCase() === 'confirmada' || r.estado?.toLowerCase() === 'activa').length;
    const reservasPendientes = reservasFiltradas.filter(r => r.estado?.toLowerCase() === 'pendiente').length;
    const reservasRechazadas = reservasFiltradas.filter(r => r.estado?.toLowerCase() === 'rechazada').length;

    // Métricas de fila virtual
    const personasEnCola = filaVirtual.length;
    const tiempoPromedioEspera = filaVirtual.length > 0
      ? filaVirtual.reduce((sum, persona) => sum + (persona.tiempoEstimado || 0), 0) / filaVirtual.length
      : 0;

    // Métricas de platos
    const platosDisponibles = platos.filter(p => p.disponible).length;
    const platosNoDisponibles = platos.filter(p => !p.disponible).length;

    setMetricas({
      mesasDisponibles,
      mesasOcupadas,
      mesasReservadas,
      totalMesas,
      tasaOcupacion,
      reservasConfirmadas,
      reservasPendientes,
      reservasRechazadas,
      totalReservas: reservasFiltradas.length,
      personasEnCola,
      platosDisponibles,
      platosNoDisponibles,
      tiempoPromedioEspera
    });
  }, [mesas, reservas, filaVirtual, platos, periodo]);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 10000);
    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  useEffect(() => {
    if (mesas.length > 0 || reservas.length > 0 || filaVirtual.length > 0) {
      calcularMetricas();
    }
  }, [mesas, reservas, filaVirtual, calcularMetricas]);

  const descargarPDF = async () => {
    try {
      // Pasar datos completos al PDF
      await downloadReportePDF({
        metricas,
        periodo,
        mesas,
        platos,
        reservas,
        filaVirtual,
        categorias,
      });
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el reporte PDF. Por favor intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="reportes-admin">
        <NavbarAdmin />
        <div className="loading-reportes">
          <div className="spinner"></div>
          <p>Cargando reportes...</p>
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
          <button onClick={cargarDatos} className="boton-reintentar">
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
          <h1 className="titulo-reportes">Reportes Operacionales</h1>
          <p className="subtitulo-reportes">Información en tiempo real del restaurante</p>
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
            <button className="boton-actualizar" onClick={cargarDatos}>
              🔄 Actualizar
            </button>
            <button className="boton-descargar-pdf" onClick={descargarPDF} title="Descargar reporte como PDF">
              📥 Descargar PDF
            </button>
          </div>
        </div>
      </section>

      {/* Resumen de Mesas */}
      <section className="seccion-resumen-ejecutivo">
        <div className="contenedor-resumen-ejecutivo">
          <h2 className="titulo-seccion-reportes">Estado de Mesas</h2>
          <div className="grilla-metricas-principales">
            <div className="tarjeta-metrica disponibles">
              <div className="icono-metrica">📊</div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Disponibles</h3>
                <p className="valor-metrica">{metricas.mesasDisponibles}</p>
                <span className="referencia">de {metricas.totalMesas} mesas</span>
              </div>
            </div>

            <div className="tarjeta-metrica ocupadas">
              <div className="icono-metrica">🍽️</div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Ocupadas</h3>
                <p className="valor-metrica">{metricas.mesasOcupadas}</p>
                <span className="referencia">en uso</span>
              </div>
            </div>

            <div className="tarjeta-metrica reservadas">
              <div className="icono-metrica">📅</div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Reservadas</h3>
                <p className="valor-metrica">{metricas.mesasReservadas}</p>
                <span className="referencia">con reserva</span>
              </div>
            </div>

            <div className="tarjeta-metrica ocupacion">
              <div className="icono-metrica">📈</div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Tasa de Ocupación</h3>
                <p className="valor-metrica">{Math.round(metricas.tasaOcupacion)}%</p>
                <span className="referencia">ocupadas + reservadas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estado de Reservas */}
      <section className="seccion-analisis-reservas">
        <div className="contenedor-analisis-reservas">
          <h2 className="titulo-seccion-reportes">Estado de Reservas - {periodo.charAt(0).toUpperCase() + periodo.slice(1)}</h2>
          <div className="grilla-reservas-metricas">
            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">Total Reservas</h3>
              <p className="valor-reserva-metrica">{metricas.totalReservas}</p>
              <span className="detalle-reserva-metrica">En el período</span>
            </div>

            <div className="tarjeta-reserva-metrica confirmada">
              <h3 className="titulo-reserva-metrica">Confirmadas</h3>
              <p className="valor-reserva-metrica">{metricas.reservasConfirmadas}</p>
              <span className="detalle-reserva-metrica">
                {metricas.totalReservas > 0
                  ? `${Math.round((metricas.reservasConfirmadas / metricas.totalReservas) * 100)}%`
                  : '0%'} del total
              </span>
            </div>

            <div className="tarjeta-reserva-metrica pendiente">
              <h3 className="titulo-reserva-metrica">Pendientes</h3>
              <p className="valor-reserva-metrica">{metricas.reservasPendientes}</p>
              <span className="detalle-reserva-metrica">Esperando confirmación</span>
            </div>

            <div className="tarjeta-reserva-metrica rechazada">
              <h3 className="titulo-reserva-metrica">Rechazadas</h3>
              <p className="valor-reserva-metrica">{metricas.reservasRechazadas}</p>
              <span className="detalle-reserva-metrica">No se concretaron</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fila Virtual */}
      <section className="seccion-fila-virtual">
        <div className="contenedor-fila-virtual">
          <h2 className="titulo-seccion-reportes">Fila Virtual</h2>
          <div className="grilla-fila-virtual">
            <div className="tarjeta-fila-principal">
              <h3 className="titulo-fila">Personas en Espera</h3>
              <p className="valor-fila">{metricas.personasEnCola}</p>
              <span className="detalle-fila">Tiempo promedio: {metricas.tiempoPromedioEspera.toFixed(0)} minutos</span>
            </div>

            <div className="lista-fila-virtual">
              <h3 className="titulo-lista-fila">Próximos en Llegar</h3>
              {filaVirtual.length === 0 ? (
                <p className="sin-datos">No hay personas en la fila virtual</p>
              ) : (
                <div className="items-fila">
                  {filaVirtual.slice(0, 5).map((persona, index) => (
                    <div key={persona.id || index} className="item-fila">
                      <span className="posicion-fila">#{persona.posicion || index + 1}</span>
                      <span className="nombre-fila">{persona.nombre || 'Cliente'}</span>
                      <span className="personas-fila">{persona.numeroPersonas || 0} personas</span>
                      <span className="tiempo-fila">≈ {persona.tiempoEstimado || 15} min</span>
                    </div>
                  ))}
                  {filaVirtual.length > 5 && (
                    <div className="mas-personas">
                      +{filaVirtual.length - 5} más en la fila
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Estado de Platos */}
      <section className="seccion-platos-disponibles">
        <div className="contenedor-platos-disponibles">
          <h2 className="titulo-seccion-reportes">Disponibilidad de Platos</h2>
          <div className="grilla-platos-status">
            <div className="tarjeta-platos-status disponibles">
              <h3 className="titulo-platos-status">Disponibles</h3>
              <p className="valor-platos-status">{metricas.platosDisponibles}</p>
              <span className="detalle-platos-status">platos activos</span>
            </div>

            <div className="tarjeta-platos-status no-disponibles">
              <h3 className="titulo-platos-status">No Disponibles</h3>
              <p className="valor-platos-status">{metricas.platosNoDisponibles}</p>
              <span className="detalle-platos-status">sin stock</span>
            </div>
          </div>

          {metricas.platosNoDisponibles > 0 && (
            <div className="lista-platos-no-disponibles">
              <h3 className="titulo-lista-platos">Platos sin disponibilidad</h3>
              <div className="items-platos-no-disponibles">
                {platos
                  .filter(p => !p.disponible)
                  .slice(0, 10)
                  .map((plato) => (
                    <div key={plato.id || plato.id_plato} className="item-plato-no-disponible">
                      <span className="nombre-plato-nd">{plato.nombre}</span>
                      <span className="descripcion-plato-nd">{plato.descripcion}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lista detallada de Reservas del día */}
      <section className="seccion-lista-reservas-detalle">
        <div className="contenedor-lista-reservas-detalle">
          <h2 className="titulo-seccion-reportes">Reservas Detalladas</h2>
          {reservas.length === 0 ? (
            <p className="sin-datos">No hay reservas registradas</p>
          ) : (
            <div className="tabla-reservas">
              <table className="tabla-reservas-detalle">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Personas</th>
                    <th>Mesa</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.slice(0, 15).map((reserva) => (
                    <tr key={reserva.id_reserva || reserva.id} className={`reserva-${reserva.estado?.toLowerCase()}`}>
                      <td className="celda-hora" data-label="Hora">{reserva.hora_inicio}</td>
                      <td className="celda-cliente" data-label="Cliente">{reserva.nombre || `Cliente #${reserva.id_cliente}`}</td>
                      <td className="celda-personas" data-label="Personas">{reserva.numero_personas || '-'}</td>
                      <td className="celda-mesa" data-label="Mesa">Mesa {reserva.id_mesa}</td>
                      <td className="celda-fecha" data-label="Fecha">{reserva.fecha}</td>
                      <td className="celda-estado" data-label="Estado">
                        <span className={`badge-estado ${reserva.estado?.toLowerCase()}`}>
                          {reserva.estado?.toUpperCase() || 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reservas.length > 15 && (
                <p className="mas-registros">... y {reservas.length - 15} reservas más</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
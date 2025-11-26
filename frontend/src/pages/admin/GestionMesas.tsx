import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/GestionMesas.css";
import { apiService } from "../../services/ApiService";
import { wsService } from "../../services/WebSocketService";

type MesaEstado = "libre" | "disponible" | "ocupada" | "reservada" | "limpieza" | string;

interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: MesaEstado;
  ubicacion?: string;
}

interface PersonaEnCola {
  id?: number;
  nombre?: string;
  telefono?: string;
  numeroPersonas?: number;
  posicion?: number;
  tiempoEstimado?: number;
}

const ESTADOS_MESA = [
  { value: "libre", label: "Disponible" },
  { value: "ocupada", label: "Ocupada" },
  { value: "reservada", label: "Reservada" },
  { value: "limpieza", label: "En limpieza" },
];

const estadoToClase = (estado: MesaEstado): string => {
  const normalized = String(estado).toLowerCase();
  if (normalized === "libre" || normalized === "disponible") return "disponible";
  if (normalized === "ocupada") return "ocupada";
  if (normalized === "reservada") return "reservada";
  if (normalized === "limpieza") return "limpieza";
  return "desconocida";
};

const estadoToLabel = (estado: MesaEstado): string => {
  const normalized = String(estado).toLowerCase();
  switch (normalized) {
    case "libre":
    case "disponible":
      return "Disponible";
    case "ocupada":
      return "Ocupada";
    case "reservada":
      return "Reservada";
    case "limpieza":
      return "En limpieza";
    default:
      return String(estado);
  }
};

const ordenarPorNumero = (lista: Mesa[]): Mesa[] => [...lista].sort((a, b) => a.numero - b.numero);

const tiempoRelativo = (fecha: Date | null): string => {
  if (!fecha) {
    return "Sin registros";
  }
  const diff = Date.now() - fecha.getTime();
  if (diff < 5000) return "justo ahora";
  const segundos = Math.floor(diff / 1000);
  if (segundos < 60) return `hace ${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} d`;
  return fecha.toLocaleString();
};

export default function GestionMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cola, setCola] = useState<PersonaEnCola[]>([]);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingCola, setLoadingCola] = useState(false);
  const [errorMesas, setErrorMesas] = useState<string | null>(null);
  const [errorCola, setErrorCola] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [estadoDrafts, setEstadoDrafts] = useState<Record<number, string>>({});
  const [accionesEnProceso, setAccionesEnProceso] = useState<Record<number, boolean>>({});
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [newMesa, setNewMesa] = useState({ numero: "", capacidad: "2", estado: "libre" });
  const [creandoMesa, setCreandoMesa] = useState(false);
  // Estado para el modal de selección de mesas
  const [mostrarModalMesas, setMostrarModalMesas] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<PersonaEnCola | null>(null);

  const cargarMesas = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoadingMesas(true);
    }
    try {
      const data = await apiService.getMesas();
      
      // Cargar reservas para actualizar el estado de las mesas
      try {
        const reservas = await apiService.getReservas();
        const hoy = new Date();
        const mesaConReserva = new Set<number>();
        
        // Marcar mesas que tienen reservas confirmadas para hoy
        reservas.forEach((res: any) => {
          if (res.estado === 'confirmada' && res.fecha === hoy.toISOString().split('T')[0]) {
            mesaConReserva.add(res.id_mesa);
          }
        });
        
        // Actualizar estado de mesas con reservas
        const mesasActualizadas = (data || []).map((mesa: any) => ({
          ...mesa,
          estado: mesaConReserva.has(mesa.numero || mesa.id_mesa) ? 'reservada' : mesa.estado
        }));
        
        setMesas(ordenarPorNumero(mesasActualizadas));
      } catch (err) {
        console.error('Error cargando reservas para actualizar mesas:', err);
        setMesas(ordenarPorNumero(data || []));
      }
      
      setUltimaActualizacion(new Date());
      setErrorMesas(null);
    } catch (error) {
      console.error("Error al cargar mesas:", error);
      setErrorMesas("No se pudieron cargar las mesas. Intenta nuevamente.");
    } finally {
      if (showSpinner) {
        setLoadingMesas(false);
      }
    }
  }, []);

  const cargarCola = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoadingCola(true);
    }
    try {
      const data = await apiService.getFilaVirtual();
      setCola(Array.isArray(data) ? data : []);
      setErrorCola(null);
    } catch (error) {
      console.error("Error al cargar la fila virtual:", error);
      setErrorCola("No se pudo cargar la fila virtual.");
    } finally {
      if (showSpinner) {
        setLoadingCola(false);
      }
    }
  }, []);

  useEffect(() => {
    wsService.connect();
    cargarMesas(true);
    cargarCola(true);

    const unsubscribeMesas = wsService.subscribe("mesas", () => {
      cargarMesas();
    });
    const unsubscribeFila = wsService.subscribe("fila_virtual", () => {
      cargarCola();
    });

    return () => {
      unsubscribeMesas();
      unsubscribeFila();
    };
  }, [cargarMesas, cargarCola]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const resumen = useMemo(() => {
    const total = mesas.length;
    const disponibles = mesas.filter((m) => estadoToClase(m.estado) === "disponible").length;
    const ocupadas = mesas.filter((m) => estadoToClase(m.estado) === "ocupada").length;
    const reservadas = mesas.filter((m) => estadoToClase(m.estado) === "reservada").length;
    const limpieza = mesas.filter((m) => estadoToClase(m.estado) === "limpieza").length;
    const porcentaje = (valor: number) => (total ? Math.round((valor / total) * 100) : 0);
    const tiempoPromedio = cola.length
      ? Math.round(
          cola.reduce((acc, persona) => acc + (persona.tiempoEstimado ?? 15), 0) / cola.length
        )
      : 0;
    return {
      total,
      disponibles,
      ocupadas,
      reservadas,
      limpieza,
      porcentajeDisponibles: porcentaje(disponibles),
      porcentajeOcupadas: porcentaje(ocupadas),
      porcentajeReservadas: porcentaje(reservadas),
      tiempoPromedio,
    };
  }, [mesas, cola]);

  const gruposMesas = useMemo(() => {
    const grupoPequeno = ordenarPorNumero(mesas.filter((m) => m.capacidad <= 2));
    const grupoMedio = ordenarPorNumero(mesas.filter((m) => m.capacidad >= 3 && m.capacidad <= 5));
    const grupoGrande = ordenarPorNumero(mesas.filter((m) => m.capacidad >= 6));

    return [
      { clave: "small", titulo: "Mesas para 1-2 personas", mesas: grupoPequeno },
      { clave: "medium", titulo: "Mesas para 3-5 personas", mesas: grupoMedio },
      { clave: "large", titulo: "Mesas para 6+ personas", mesas: grupoGrande },
    ];
  }, [mesas]);

  const colaOrdenada = useMemo(
    () =>
      [...cola].sort((a, b) => {
        const posicionA = a.posicion ?? a.id ?? 0;
        const posicionB = b.posicion ?? b.id ?? 0;
        return posicionA - posicionB;
      }),
    [cola]
  );

  const ultimaActualizacionTexto = useMemo(
    () => tiempoRelativo(ultimaActualizacion),
    [ultimaActualizacion]
  );

  const handleNewMesaChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setNewMesa((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearMesa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numero = parseInt(newMesa.numero, 10);
    const capacidad = parseInt(newMesa.capacidad, 10);

    if (Number.isNaN(numero) || numero <= 0 || Number.isNaN(capacidad) || capacidad <= 0) {
      setErrorMesas("Ingresa valores numéricos válidos para número y capacidad.");
      return;
    }

    setCreandoMesa(true);
    try {
      await apiService.crearMesa({
        numero,
        capacidad,
        estado: newMesa.estado,
      });
      setFeedback(`Mesa ${numero} creada correctamente.`);
      setNewMesa({ numero: "", capacidad: "2", estado: "libre" });
      await cargarMesas();
    } catch (error) {
      console.error("Error al crear mesa:", error);
      setErrorMesas("No se pudo crear la mesa. Revisa los datos e intenta nuevamente.");
    } finally {
      setCreandoMesa(false);
    }
  };

  const handleEstadoDraftChange = (mesaId: number, value: string) => {
    setEstadoDrafts((prev) => ({ ...prev, [mesaId]: value }));
  };

  const handleActualizarEstado = async (mesa: Mesa) => {
    const nuevoEstado = estadoDrafts[mesa.id] ?? mesa.estado;
    if (nuevoEstado === mesa.estado) {
      setFeedback("Selecciona un estado diferente para actualizar la mesa.");
      return;
    }

    setAccionesEnProceso((prev) => ({ ...prev, [mesa.id]: true }));
    try {
      await apiService.actualizarMesa({
        id: mesa.id,
        numero: mesa.numero,
        capacidad: mesa.capacidad,
        estado: nuevoEstado,
        ubicacion: mesa.ubicacion ?? "",
      });
      setFeedback(`Mesa ${mesa.numero} actualizada a estado ${estadoToLabel(nuevoEstado)}.`);
      setEstadoDrafts((prev) => {
        const { [mesa.id]: _, ...rest } = prev;
        return rest;
      });
      await cargarMesas();
    } catch (error) {
      console.error("Error al actualizar mesa:", error);
      setErrorMesas("No se pudo actualizar el estado de la mesa.");
    } finally {
      setAccionesEnProceso((prev) => {
        const { [mesa.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleEliminarMesa = async (mesa: Mesa) => {
    const confirmado = window.confirm(`¿Deseas eliminar la mesa ${mesa.numero}?`);
    if (!confirmado) {
      return;
    }

    setAccionesEnProceso((prev) => ({ ...prev, [mesa.id]: true }));
    try {
      await apiService.eliminarMesa(mesa.id);
      setFeedback(`Mesa ${mesa.numero} eliminada correctamente.`);
      await cargarMesas(true);
    } catch (error) {
      console.error("Error al eliminar mesa:", error);
      setErrorMesas("No se pudo eliminar la mesa seleccionada.");
    } finally {
      setAccionesEnProceso((prev) => {
        const { [mesa.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleRefrescar = () => {
    cargarMesas(true);
    cargarCola(true);
  };

  const handleAsignarMesa = useCallback(
    (cliente: PersonaEnCola) => {
      // Abrir modal para seleccionar mesa
      setClienteSeleccionado(cliente);
      setMostrarModalMesas(true);
    },
    []
  );

  const handleConfirmarAsignacion = useCallback(
    async (mesaId: number) => {
      if (!clienteSeleccionado) return;
      
      setAccionesEnProceso((prev) => ({ ...prev, [mesaId]: true }));
      try {
        const mesa = mesas.find((m) => m.id === mesaId);
        if (!mesa) return;

        await apiService.actualizarMesa({
          id: mesa.id,
          numero: mesa.numero,
          capacidad: mesa.capacidad,
          estado: "ocupada",
          ubicacion: mesa.ubicacion ?? "",
        });
        
        // Eliminar cliente de la cola
        if (clienteSeleccionado.id) {
          await apiService.eliminarFilaVirtual(clienteSeleccionado.id);
        }
        
        setFeedback(
          `Mesa ${mesa.numero} asignada a ${clienteSeleccionado.nombre || `Cliente ${clienteSeleccionado.id}`}`
        );
        setMostrarModalMesas(false);
        setClienteSeleccionado(null);
        await cargarMesas();
        await cargarCola();
      } catch (error) {
        console.error("Error al asignar mesa:", error);
        setErrorMesas("No se pudo asignar la mesa al cliente.");
      } finally {
        setAccionesEnProceso((prev) => {
          const { [mesaId]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [clienteSeleccionado, mesas]
  );

  const handleEliminarDesCola = useCallback(async (clienteId: number | undefined) => {
    if (!clienteId) return;

    const confirmado = window.confirm(
      "¿Deseas eliminar este cliente de la fila virtual?"
    );
    if (!confirmado) return;

    try {
      await apiService.eliminarFilaVirtual(clienteId);
      setFeedback("Cliente eliminado de la fila virtual.");
      await cargarCola(true);
    } catch (error) {
      console.error("Error al eliminar de cola:", error);
      setErrorCola("No se pudo eliminar el cliente de la fila.");
    }
  }, []);

  return (
    <div className="gestion-mesas-admin">
      <NavbarAdmin />

      <section className="header-gestion-mesas">
        <div className="contenedor-header-mesas">
          <h1 className="titulo-gestion-mesas">Gestión de Mesas</h1>
          <p className="subtitulo-gestion-mesas">
            Control centralizado de disponibilidad con actualizaciones en tiempo real
          </p>
          <div className="info-actualizacion">
            <span className="ultima-actualizacion">
              Última actualización: {loadingMesas ? "cargando..." : ultimaActualizacionTexto}
            </span>
            <button
              className="boton-actualizar"
              onClick={handleRefrescar}
              disabled={loadingMesas || creandoMesa}
              type="button"
            >
              {loadingMesas ? "Actualizando..." : "🔄 Actualizar"}
            </button>
          </div>
        </div>
      </section>

      <section className="seccion-resumen-mesas">
        <div className="contenedor-resumen-mesas">
          {feedback && <div className="alerta-admin alerta-exito">{feedback}</div>}
          {errorMesas && <div className="alerta-admin alerta-error">{errorMesas}</div>}

          <div className="grilla-resumen-mesas">
            <div className="tarjeta-resumen disponibles">
              <h3 className="titulo-resumen">Mesas Disponibles</h3>
              <p className="numero-resumen">{resumen.disponibles}</p>
              <span className="detalle-resumen">
                {resumen.total ? `${resumen.porcentajeDisponibles}% del total` : "Sin datos"}
              </span>
            </div>
            <div className="tarjeta-resumen ocupadas">
              <h3 className="titulo-resumen">Mesas Ocupadas</h3>
              <p className="numero-resumen">{resumen.ocupadas}</p>
              <span className="detalle-resumen">
                {resumen.total ? `${resumen.porcentajeOcupadas}% del total` : "Sin datos"}
              </span>
            </div>
            <div className="tarjeta-resumen reservadas">
              <h3 className="titulo-resumen">Mesas Reservadas</h3>
              <p className="numero-resumen">{resumen.reservadas}</p>
              <span className="detalle-resumen">
                {resumen.total ? `${resumen.porcentajeReservadas}% del total` : "Sin datos"}
              </span>
            </div>
            <div className="tarjeta-resumen tiempo-promedio">
              <h3 className="titulo-resumen">Tiempo Promedio</h3>
              <p className="numero-resumen">
                {resumen.tiempoPromedio ? `${resumen.tiempoPromedio} min` : "N/D"}
              </p>
              <span className="detalle-resumen">Basado en la fila virtual de clientes</span>
            </div>
          </div>
        </div>
      </section>

      <section className="seccion-estado-mesas">
        <div className="contenedor-estado-mesas">
          <h2 className="titulo-seccion-mesas">Panel de Control de Mesas</h2>

          <div className="panel-controles-mesas">
            <div className="panel-control">
              <h3 className="panel-control__titulo">Registrar nueva mesa</h3>
              <p className="panel-control__descripcion">
                Configura mesas adicionales para ampliar la capacidad del salón.
              </p>
              <form className="formulario-nueva-mesa" onSubmit={handleCrearMesa}>
                <div className="campo-formulario">
                  <label className="label-formulario" htmlFor="numeroMesa">
                    Número de mesa
                  </label>
                  <input
                    className="input-admin"
                    id="numeroMesa"
                    name="numero"
                    type="number"
                    min={1}
                    placeholder="Ej. 10"
                    value={newMesa.numero}
                    onChange={handleNewMesaChange}
                    required
                  />
                </div>
                <div className="campo-formulario">
                  <label className="label-formulario" htmlFor="capacidadMesa">
                    Capacidad
                  </label>
                  <input
                    className="input-admin"
                    id="capacidadMesa"
                    name="capacidad"
                    type="number"
                    min={1}
                    placeholder="Ej. 4"
                    value={newMesa.capacidad}
                    onChange={handleNewMesaChange}
                    required
                  />
                </div>
                <div className="campo-formulario">
                  <label className="label-formulario" htmlFor="estadoMesa">
                    Estado inicial
                  </label>
                  <select
                    className="select-admin"
                    id="estadoMesa"
                    name="estado"
                    value={newMesa.estado}
                    onChange={handleNewMesaChange}
                  >
                    {ESTADOS_MESA.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="acciones-formulario">
                  <button className="boton-crear-mesa" type="submit" disabled={creandoMesa}>
                    {creandoMesa ? "Guardando..." : "Añadir mesa"}
                  </button>
                </div>
              </form>
            </div>

            <div className="panel-control panel-control--info">
              <h3 className="panel-control__titulo">Sincronización en vivo</h3>
              <p className="panel-control__descripcion">
                Esta vista escucha los canales <strong>mesas</strong> y <strong>fila_virtual</strong> del
                WebSocket, recargando automáticamente la información relevante.
              </p>
              <ul className="lista-sincronizacion">
                <li>Altas, bajas y cambios se reflejan en segundos.</li>
                <li>La fila virtual se mantiene sincronizada para coordinar asignaciones.</li>
                <li>Utiliza el botón “Actualizar” si detectas datos fuera de sincronía.</li>
              </ul>
            </div>
          </div>

          {gruposMesas.map((grupo) => (
            <div className="grupo-mesas-admin" key={grupo.clave}>
              <h3 className="titulo-grupo-mesas">{grupo.titulo}</h3>
              {loadingMesas ? (
                <p className="mensaje-sin-datos">Cargando información de mesas...</p>
              ) : grupo.mesas.length === 0 ? (
                <p className="mensaje-sin-datos">
                  No hay mesas registradas para este rango de capacidad.
                </p>
              ) : (
                <div className="grilla-mesas-admin">
                  {grupo.mesas.map((mesa) => {
                    const claseEstado = estadoToClase(mesa.estado);
                    const estadoSeleccionado = estadoDrafts[mesa.id] ?? String(mesa.estado);
                    const accionEnCurso = Boolean(accionesEnProceso[mesa.id]);
                    const botonActualizarDeshabilitado =
                      accionEnCurso || estadoSeleccionado === String(mesa.estado);

                    return (
                      <div className={`tarjeta-mesa-admin ${claseEstado}`} key={mesa.id}>
                        <div className="header-mesa-admin">
                          <span className="numero-mesa-admin">Mesa {mesa.numero}</span>
                          <span className="capacidad-mesa-admin">{mesa.capacidad} personas</span>
                        </div>
                        <div className="estado-mesa-admin">
                          <span className={`indicador-estado ${claseEstado}`}>
                            {estadoToLabel(mesa.estado)}
                          </span>
                        </div>
                        <div className="info-mesa-admin">
                          <p>
                            <strong>ID interno:</strong> {mesa.id}
                          </p>
                          {mesa.ubicacion && (
                            <p>
                              <strong>Ubicación:</strong> {mesa.ubicacion}
                            </p>
                          )}
                        </div>
                        <div className="acciones-mesa-admin">
                          <select
                            className="select-admin"
                            value={estadoSeleccionado}
                            onChange={(event) =>
                              handleEstadoDraftChange(mesa.id, event.target.value)
                            }
                            disabled={accionEnCurso}
                          >
                            {ESTADOS_MESA.map((estado) => (
                              <option key={estado.value} value={estado.value}>
                                {estado.label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="boton-guardar-cambios"
                            type="button"
                            onClick={() => handleActualizarEstado(mesa)}
                            disabled={botonActualizarDeshabilitado}
                          >
                            {accionEnCurso ? "Guardando..." : "Guardar estado"}
                          </button>
                          <button
                            className="boton-eliminar-mesa"
                            type="button"
                            onClick={() => handleEliminarMesa(mesa)}
                            disabled={accionEnCurso}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="seccion-cola-espera-admin">
        <div className="contenedor-cola-admin">
          <h2 className="titulo-seccion-mesas">Cola de Espera Virtual</h2>

          {errorCola && <div className="alerta-admin alerta-error">{errorCola}</div>}

          {loadingCola ? (
            <p className="mensaje-sin-datos">Cargando información de la fila virtual...</p>
          ) : colaOrdenada.length === 0 ? (
            <p className="mensaje-sin-datos">No hay clientes esperando turno en este momento.</p>
          ) : (
            <div className="lista-cola-admin">
              {colaOrdenada.map((cliente, index) => (
                <div className="cliente-cola-admin" key={cliente.id ?? index}>
                  <div className="info-cliente-cola">
                    <span className="posicion-cliente">
                      {(cliente.posicion ?? index + 1).toString()}°
                    </span>
                    <span className="nombre-cliente">
                      {cliente.nombre ?? `Cliente ${cliente.id ?? index + 1}`}
                    </span>
                    <span className="telefono-cliente">
                      {cliente.telefono && cliente.telefono.trim() !== ""
                        ? cliente.telefono
                        : "Sin teléfono"}
                    </span>
                    <span className="personas-cliente">
                      {(cliente.numeroPersonas ?? 2).toString()} personas
                    </span>
                    <span className="tiempo-espera-cliente">
                      Estimado: {(cliente.tiempoEstimado ?? 15).toString()} min
                    </span>
                  </div>
                  <div className="acciones-cliente-cola">
                    <button
                      className="boton-asignar-mesa"
                      type="button"
                      onClick={() => handleAsignarMesa(cliente)}
                    >
                      ✓ Asignar mesa
                    </button>
                    <button
                      className="boton-eliminar-cola"
                      type="button"
                      onClick={() => handleEliminarDesCola(cliente.id)}
                    >
                      ❌ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal para seleccionar mesa */}
      {mostrarModalMesas && clienteSeleccionado && (
        <div className="modal-overlay" onClick={() => {
          setMostrarModalMesas(false);
          setClienteSeleccionado(null);
        }}>
          <div className="modal-contenedor" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-titulo">Seleccionar Mesa para {clienteSeleccionado.nombre || `Cliente ${clienteSeleccionado.id}`}</h2>
              <button 
                className="modal-cerrar" 
                onClick={() => {
                  setMostrarModalMesas(false);
                  setClienteSeleccionado(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-contenido">
              <p className="info-cliente">
                <strong>Clientes:</strong> {clienteSeleccionado.numeroPersonas || 2} personas
              </p>
              <div className="grilla-mesas-modal">
                {mesas
                  .filter((m) => estadoToClase(m.estado) === "disponible")
                  .map((mesa) => (
                    <div key={mesa.id} className="tarjeta-mesa-modal">
                      <div className="numero-mesa-modal">{mesa.numero}</div>
                      <div className="detalles-mesa-modal">
                        <p className="capacidad-mesa">Capacidad: {mesa.capacidad}</p>
                        <p className="ubicacion-mesa">{mesa.ubicacion || "Sin ubicación"}</p>
                      </div>
                      <button
                        className="boton-seleccionar-mesa"
                        onClick={() => handleConfirmarAsignacion(mesa.id)}
                        disabled={accionesEnProceso[mesa.id]}
                      >
                        {accionesEnProceso[mesa.id] ? "Asignando..." : "Seleccionar"}
                      </button>
                    </div>
                  ))}
              </div>
              {mesas.filter((m) => estadoToClase(m.estado) === "disponible").length === 0 && (
                <div className="mensaje-sin-mesas">
                  <p>No hay mesas disponibles en este momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
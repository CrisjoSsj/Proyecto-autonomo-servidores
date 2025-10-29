import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/Dashboard.css";


export default function Dashboard() {
  return (
    <div className="dashboard-admin">
      <NavbarAdmin />
      
      {/* Header del dashboard */}
      <section className="header-dashboard">
        <div className="contenedor-header">
          <h1 className="titulo-dashboard">Panel de Administración</h1>
          <p className="subtitulo-dashboard">Gestiona tu restaurante Chuwue Grill</p>
          <div className="fecha-actual">
            <span className="fecha">Hoy: Domingo, 22 de Septiembre 2025</span>
            <span className="hora-actual">2:45 PM</span>
          </div>
        </div>
      </section>

      {/* Estadísticas principales */}
      <section className="seccion-estadisticas">
        <div className="contenedor-estadisticas">
          <h2 className="titulo-seccion-admin">Estadísticas de Hoy</h2>
          <div className="grilla-estadisticas">
            
            <div className="tarjeta-estadistica ventas">
              <div className="icono-estadistica ventas-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Ventas del Día</h3>
                <p className="valor-estadistica">$2,847.50</p>
                <span className="comparacion positiva">+15% vs ayer</span>
              </div>
            </div>

            <div className="tarjeta-estadistica ordenes">
              <div className="icono-estadistica ordenes-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Órdenes Completadas</h3>
                <p className="valor-estadistica">47</p>
                <span className="comparacion positiva">+8 vs ayer</span>
              </div>
            </div>

            <div className="tarjeta-estadistica clientes">
              <div className="icono-estadistica clientes-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Clientes Atendidos</h3>
                <p className="valor-estadistica">134</p>
                <span className="comparacion neutra">Similar a ayer</span>
              </div>
            </div>

            <div className="tarjeta-estadistica tiempo-promedio">
              <div className="icono-estadistica tiempo-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Tiempo Promedio</h3>
                <p className="valor-estadistica">28 min</p>
                <span className="comparacion negativa">+3 min vs ayer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estado actual del restaurante */}
      <section className="seccion-estado-actual">
        <div className="contenedor-estado-actual">
          <h2 className="titulo-seccion-admin">Estado Actual del Restaurante</h2>
          <div className="grilla-estado-actual">
            
            <div className="tarjeta-estado">
              <h3 className="titulo-estado">Mesas Ocupadas</h3>
              <div className="indicador-mesas">
                <span className="numero-mesas">6</span>
                <span className="total-mesas">/ 9 mesas</span>
              </div>
              <div className="progreso-ocupacion">
                <div className="barra-progreso">
                  <div className="progreso-actual" style={{width: '67%'}}></div>
                </div>
                <span className="porcentaje-ocupacion">67% ocupación</span>
              </div>
            </div>

            <div className="tarjeta-estado">
              <h3 className="titulo-estado">Cola de Espera</h3>
              <div className="info-cola">
                <span className="numero-espera">4 clientes</span>
                <span className="tiempo-espera-promedio">~25 min promedio</span>
              </div>
            </div>

            <div className="tarjeta-estado">
              <h3 className="titulo-estado">Reservas Hoy</h3>
              <div className="info-reservas">
                <span className="numero-reservas">12 reservas</span>
                <span className="proxima-reserva">Próxima: 3:30 PM</span>
              </div>
            </div>

            <div className="tarjeta-estado">
              <h3 className="titulo-estado">Personal en Turno</h3>
              <div className="info-personal">
                <span className="numero-personal">8 empleados</span>
                <span className="distribucion-personal">3 meseros, 3 cocina, 2 admin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="seccion-acciones-rapidas">
        <div className="contenedor-acciones">
          <h2 className="titulo-seccion-admin">Acciones Rápidas</h2>
          <div className="grilla-acciones">
            
            <div className="tarjeta-accion">
              <div className="icono-accion mesas-icon"></div>
              <h3 className="titulo-accion">Gestionar Mesas</h3>
              <p className="descripcion-accion">Ver estado y gestionar ocupación de mesas</p>
              <button className="boton-accion">Ir a Mesas</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion reservas-icon"></div>
              <h3 className="titulo-accion">Ver Reservas</h3>
              <p className="descripcion-accion">Gestionar reservas de hoy y futuras</p>
              <button className="boton-accion">Ver Reservas</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion menu-icon"></div>
              <h3 className="titulo-accion">Editar Menú</h3>
              <p className="descripcion-accion">Actualizar platos, precios y disponibilidad</p>
              <button className="boton-accion">Editar Menú</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion reportes-icon"></div>
              <h3 className="titulo-accion">Ver Reportes</h3>
              <p className="descripcion-accion">Análisis de ventas y estadísticas</p>
              <button className="boton-accion">Ver Reportes</button>
            </div>
          </div>
        </div>
      </section>

      {/* Alertas y notificaciones */}
      <section className="seccion-alertas-admin">
        <div className="contenedor-alertas-admin">
          <h2 className="titulo-seccion-admin">Alertas y Notificaciones</h2>
          <div className="lista-alertas-admin">
            
            <div className="alerta-admin urgente">
              <div className="icono-alerta-admin urgente-icon"></div>
              <div className="contenido-alerta-admin">
                <h3 className="titulo-alerta-admin">Mesa 4 - Tiempo excedido</h3>
                <p className="mensaje-alerta-admin">
                  La mesa 4 lleva 2h 15min ocupada. Considerar consultar con el cliente.
                </p>
                <span className="tiempo-alerta">Hace 15 minutos</span>
              </div>
              <button className="boton-resolver-alerta">Resolver</button>
            </div>

            <div className="alerta-admin importante">
              <div className="icono-alerta-admin importante-icon"></div>
              <div className="contenido-alerta-admin">
                <h3 className="titulo-alerta-admin">Inventario Bajo</h3>
                <p className="mensaje-alerta-admin">
                  Alitas BBQ - Quedan solo 15 porciones. Considerar reabastecer.
                </p>
                <span className="tiempo-alerta">Hace 30 minutos</span>
              </div>
              <button className="boton-resolver-alerta">Ver Inventario</button>
            </div>

            <div className="alerta-admin informativa">
              <div className="icono-alerta-admin info-icon"></div>
              <div className="contenido-alerta-admin">
                <h3 className="titulo-alerta-admin">Nueva Reserva</h3>
                <p className="mensaje-alerta-admin">
                  Reserva para 6 personas confirmada para las 8:00 PM - Mesa 9.
                </p>
                <span className="tiempo-alerta">Hace 5 minutos</span>
              </div>
              <button className="boton-resolver-alerta">Ver Detalles</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
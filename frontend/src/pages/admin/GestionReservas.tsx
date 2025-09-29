import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/GestionReservas.css";

export default function GestionReservas() {
  return (
    <div className="gestion-reservas-admin">
      <NavbarAdmin />
      
      {/* Header de gestión de reservas */}
      <section className="header-gestion-reservas">
        <div className="contenedor-header-reservas">
          <h1 className="titulo-gestion-reservas">Gestión de Reservas</h1>
          <p className="subtitulo-gestion-reservas">Administra todas las reservas del restaurante</p>
          <div className="filtros-fecha">
            <select className="selector-fecha">
              <option value="hoy">Hoy - 22 Sept 2025</option>
              <option value="manana">Mañana - 23 Sept 2025</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
            </select>
            <button className="boton-nueva-reserva">+ Nueva Reserva</button>
          </div>
        </div>
      </section>

      {/* Resumen de reservas */}
      <section className="seccion-resumen-reservas">
        <div className="contenedor-resumen-reservas">
          <div className="grilla-resumen-reservas">
            <div className="tarjeta-resumen-reservas confirmadas">
              <h3 className="titulo-resumen-reservas">Confirmadas Hoy</h3>
              <p className="numero-resumen-reservas">12</p>
              <span className="detalle-resumen-reservas">8 pendientes por llegar</span>
            </div>
            <div className="tarjeta-resumen-reservas pendientes">
              <h3 className="titulo-resumen-reservas">Pendientes</h3>
              <p className="numero-resumen-reservas">3</p>
              <span className="detalle-resumen-reservas">Sin confirmar</span>
            </div>
            <div className="tarjeta-resumen-reservas completadas">
              <h3 className="titulo-resumen-reservas">Completadas</h3>
              <p className="numero-resumen-reservas">4</p>
              <span className="detalle-resumen-reservas">Ya atendidas</span>
            </div>
            <div className="tarjeta-resumen-reservas canceladas">
              <h3 className="titulo-resumen-reservas">Canceladas</h3>
              <p className="numero-resumen-reservas">1</p>
              <span className="detalle-resumen-reservas">Hoy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de reservas del día */}
      <section className="seccion-reservas-dia">
        <div className="contenedor-reservas-dia">
          <h2 className="titulo-seccion-reservas">Reservas de Hoy - 22 Septiembre 2025</h2>
          
          <div className="lista-reservas-admin">
            
            {/* Reserva completada */}
            <div className="tarjeta-reserva-admin completada">
              <div className="header-reserva-admin">
                <div className="info-basica-reserva">
                  <span className="hora-reserva">12:00 PM</span>
                  <span className="nombre-cliente-reserva">Laura Martínez</span>
                  <span className="personas-reserva">2 personas</span>
                  <span className="mesa-asignada">Mesa 2</span>
                </div>
                <div className="estado-reserva">
                  <span className="badge-estado completada">Completada</span>
                </div>
              </div>
              <div className="detalles-reserva">
                <p className="telefono-reserva">📞 099-111-2222</p>
                <p className="ocasion-reserva">💕 Aniversario</p>
                <p className="comentarios-reserva">Solicitó mesa junto a la ventana</p>
                <p className="hora-llegada">✅ Llegó: 12:05 PM | Salió: 1:45 PM</p>
              </div>
              <div className="acciones-reserva-admin">
                <button className="boton-ver-cuenta">Ver Cuenta</button>
                <button className="boton-historial">Historial</button>
              </div>
            </div>

            {/* Reserva en curso */}
            <div className="tarjeta-reserva-admin en-curso">
              <div className="header-reserva-admin">
                <div className="info-basica-reserva">
                  <span className="hora-reserva">2:30 PM</span>
                  <span className="nombre-cliente-reserva">Familia Rodríguez</span>
                  <span className="personas-reserva">6 personas</span>
                  <span className="mesa-asignada">Mesa 8</span>
                </div>
                <div className="estado-reserva">
                  <span className="badge-estado en-curso">En Curso</span>
                </div>
              </div>
              <div className="detalles-reserva">
                <p className="telefono-reserva">📞 099-333-4444</p>
                <p className="ocasion-reserva">🎂 Cumpleaños infantil</p>
                <p className="comentarios-reserva">Niño de 8 años - Decoración especial solicitada</p>
                <p className="hora-llegada">✅ Llegó: 2:25 PM | Tiempo en mesa: 20 min</p>
              </div>
              <div className="acciones-reserva-admin">
                <button className="boton-ver-mesa">Ver Mesa</button>
                <button className="boton-generar-cuenta">Generar Cuenta</button>
                <button className="boton-agregar-nota">Agregar Nota</button>
              </div>
            </div>

            {/* Reserva próxima */}
            <div className="tarjeta-reserva-admin proxima">
              <div className="header-reserva-admin">
                <div className="info-basica-reserva">
                  <span className="hora-reserva">3:30 PM</span>
                  <span className="nombre-cliente-reserva">Carlos Mendoza</span>
                  <span className="personas-reserva">4 personas</span>
                  <span className="mesa-asignada">Mesa 5</span>
                </div>
                <div className="estado-reserva">
                  <span className="badge-estado proxima">Próxima (45 min)</span>
                </div>
              </div>
              <div className="detalles-reserva">
                <p className="telefono-reserva">📞 099-555-6666</p>
                <p className="ocasion-reserva">🍽️ Cena de negocios</p>
                <p className="comentarios-reserva">Cliente VIP - Solicita atención preferencial</p>
                <p className="confirmacion">✅ Confirmado vía SMS hace 1 hora</p>
              </div>
              <div className="acciones-reserva-admin">
                <button className="boton-preparar-mesa">Preparar Mesa</button>
                <button className="boton-llamar-cliente">📞 Llamar</button>
                <button className="boton-editar-reserva">Editar</button>
              </div>
            </div>

            {/* Reserva pendiente de confirmación */}
            <div className="tarjeta-reserva-admin pendiente">
              <div className="header-reserva-admin">
                <div className="info-basica-reserva">
                  <span className="hora-reserva">6:00 PM</span>
                  <span className="nombre-cliente-reserva">Ana González</span>
                  <span className="personas-reserva">3 personas</span>
                  <span className="mesa-asignada">Sin asignar</span>
                </div>
                <div className="estado-reserva">
                  <span className="badge-estado pendiente">Pendiente Confirmación</span>
                </div>
              </div>
              <div className="detalles-reserva">
                <p className="telefono-reserva">📞 099-777-8888</p>
                <p className="ocasion-reserva">🎉 Celebración</p>
                <p className="comentarios-reserva">Primera vez en el restaurante</p>
                <p className="tiempo-creacion">⏰ Creada hace 2 horas - Sin confirmar</p>
              </div>
              <div className="acciones-reserva-admin">
                <button className="boton-confirmar-reserva">Confirmar</button>
                <button className="boton-asignar-mesa">Asignar Mesa</button>
                <button className="boton-cancelar-reserva">Cancelar</button>
              </div>
            </div>

            {/* Reserva para más tarde */}
            <div className="tarjeta-reserva-admin futura">
              <div className="header-reserva-admin">
                <div className="info-basica-reserva">
                  <span className="hora-reserva">7:30 PM</span>
                  <span className="nombre-cliente-reserva">Miguel Torres</span>
                  <span className="personas-reserva">2 personas</span>
                  <span className="mesa-asignada">Mesa 3</span>
                </div>
                <div className="estado-reserva">
                  <span className="badge-estado futura">Confirmada (4h 45min)</span>
                </div>
              </div>
              <div className="detalles-reserva">
                <p className="telefono-reserva">📞 099-999-0000</p>
                <p className="ocasion-reserva">💑 Cita romántica</p>
                <p className="comentarios-reserva">Solicita mesa íntima, velas, música suave</p>
                <p className="confirmacion">✅ Confirmado | Recordatorio enviado</p>
              </div>
              <div className="acciones-reserva-admin">
                <button className="boton-preparar-ambiente">Preparar Ambiente</button>
                <button className="boton-ver-detalles">Ver Detalles</button>
                <button className="boton-editar-reserva">Editar</button>
              </div>
            </div>

            {/* Reserva de evento especial */}
            <div className="tarjeta-reserva-admin evento-especial">
              <div className="header-reserva-admin">
                <div className="info-basica-reserva">
                  <span className="hora-reserva">8:00 PM</span>
                  <span className="nombre-cliente-reserva">Empresa XYZ</span>
                  <span className="personas-reserva">8 personas</span>
                  <span className="mesa-asignada">Mesa 9</span>
                </div>
                <div className="estado-reserva">
                  <span className="badge-estado evento">Evento Corporativo</span>
                </div>
              </div>
              <div className="detalles-reserva">
                <p className="telefono-reserva">📞 099-123-4567</p>
                <p className="contacto-reserva">👤 Contacto: Roberto Silva (Gerente RRHH)</p>
                <p className="ocasion-reserva">🏢 Celebración de ventas trimestrales</p>
                <p className="comentarios-reserva">Menú preestablecido, facturación empresarial, decoración corporativa</p>
                <p className="confirmacion">✅ Evento confirmado | Todo preparado</p>
              </div>
              <div className="acciones-reserva-admin">
                <button className="boton-ver-menu-evento">Ver Menú Evento</button>
                <button className="boton-checklist-evento">Checklist</button>
                <button className="boton-contactar-empresa">Contactar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reservas futuras (próximos días) */}
      <section className="seccion-reservas-futuras">
        <div className="contenedor-reservas-futuras">
          <h2 className="titulo-seccion-reservas">Próximas Reservas (Siguientes 7 días)</h2>
          
          <div className="calendario-reservas">
            <div className="dia-calendario">
              <h3 className="fecha-calendario">Mañana - 23 Sept</h3>
              <div className="resumen-dia">
                <span className="total-reservas-dia">6 reservas</span>
                <span className="horario-pico">Pico: 7-9 PM</span>
              </div>
            </div>
            
            <div className="dia-calendario">
              <h3 className="fecha-calendario">Martes - 24 Sept</h3>
              <div className="resumen-dia">
                <span className="total-reservas-dia">4 reservas</span>
                <span className="horario-pico">Normal</span>
              </div>
            </div>
            
            <div className="dia-calendario fin-semana">
              <h3 className="fecha-calendario">Viernes - 27 Sept</h3>
              <div className="resumen-dia">
                <span className="total-reservas-dia">15 reservas</span>
                <span className="horario-pico alerta">¡Lleno!</span>
              </div>
            </div>
            
            <div className="dia-calendario fin-semana">
              <h3 className="fecha-calendario">Sábado - 28 Sept</h3>
              <div className="resumen-dia">
                <span className="total-reservas-dia">18 reservas</span>
                <span className="horario-pico alerta">¡Lleno!</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/GestionMesas.css";

export default function GestionMesas() {
  return (
    <div className="gestion-mesas-admin">
      <NavbarAdmin />
      
      {/* Header de gestión de mesas */}
      <section className="header-gestion-mesas">
        <div className="contenedor-header-mesas">
          <h1 className="titulo-gestion-mesas">Gestión de Mesas</h1>
          <p className="subtitulo-gestion-mesas">Control en tiempo real del estado de todas las mesas</p>
          <div className="info-actualizacion">
            <span className="ultima-actualizacion">Última actualización: hace 1 minuto</span>
            <button className="boton-actualizar">🔄 Actualizar</button>
          </div>
        </div>
      </section>

      {/* Resumen general */}
      <section className="seccion-resumen-mesas">
        <div className="contenedor-resumen-mesas">
          <div className="grilla-resumen-mesas">
            <div className="tarjeta-resumen disponibles">
              <h3 className="titulo-resumen">Mesas Disponibles</h3>
              <p className="numero-resumen">3</p>
              <span className="detalle-resumen">33% del total</span>
            </div>
            <div className="tarjeta-resumen ocupadas">
              <h3 className="titulo-resumen">Mesas Ocupadas</h3>
              <p className="numero-resumen">6</p>
              <span className="detalle-resumen">67% del total</span>
            </div>
            <div className="tarjeta-resumen reservadas">
              <h3 className="titulo-resumen">Reservadas Hoy</h3>
              <p className="numero-resumen">4</p>
              <span className="detalle-resumen">Próximas 4 horas</span>
            </div>
            <div className="tarjeta-resumen tiempo-promedio">
              <h3 className="titulo-resumen">Tiempo Promedio</h3>
              <p className="numero-resumen">45 min</p>
              <span className="detalle-resumen">Por mesa ocupada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Estado detallado de mesas */}
      <section className="seccion-estado-mesas">
        <div className="contenedor-estado-mesas">
          <h2 className="titulo-seccion-mesas">Estado Detallado de Mesas</h2>
          
          {/* Mesas para 2 personas */}
          <div className="grupo-mesas-admin">
            <h3 className="titulo-grupo-mesas">Mesas para 2 Personas</h3>
            <div className="grilla-mesas-admin">
              
              <div className="tarjeta-mesa-admin disponible">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 1</span>
                  <span className="capacidad-mesa-admin">2 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado disponible">Disponible</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="tiempo-disponible">Disponible desde hace 10 min</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-asignar">Asignar Cliente</button>
                  <button className="boton-reservar">Reservar</button>
                </div>
              </div>

              <div className="tarjeta-mesa-admin ocupada">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 2</span>
                  <span className="capacidad-mesa-admin">2 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado ocupada">Ocupada</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="cliente-actual">Cliente: Juan Pérez</p>
                  <p className="tiempo-ocupada">Ocupada: 1h 25min</p>
                  <p className="orden-estado">Orden: Servida</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-cuenta">Generar Cuenta</button>
                  <button className="boton-liberar">Liberar Mesa</button>
                </div>
              </div>

              <div className="tarjeta-mesa-admin disponible">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 3</span>
                  <span className="capacidad-mesa-admin">2 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado disponible">Disponible</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="tiempo-disponible">Disponible desde hace 5 min</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-asignar">Asignar Cliente</button>
                  <button className="boton-reservar">Reservar</button>
                </div>
              </div>
            </div>
          </div>

          {/* Mesas para 4 personas */}
          <div className="grupo-mesas-admin">
            <h3 className="titulo-grupo-mesas">Mesas para 4 Personas</h3>
            <div className="grilla-mesas-admin">
              
              <div className="tarjeta-mesa-admin ocupada">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 4</span>
                  <span className="capacidad-mesa-admin">4 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado ocupada tiempo-excedido">Ocupada - Tiempo Excedido</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="cliente-actual">Cliente: María García</p>
                  <p className="tiempo-ocupada excedido">Ocupada: 2h 15min ⚠️</p>
                  <p className="orden-estado">Orden: Finalizada</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-cuenta urgente">Generar Cuenta</button>
                  <button className="boton-consultar">Consultar Cliente</button>
                </div>
              </div>

              <div className="tarjeta-mesa-admin reservada">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 5</span>
                  <span className="capacidad-mesa-admin">4 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado reservada">Reservada</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="cliente-reserva">Reserva: Carlos Mendoza</p>
                  <p className="hora-reserva">Hora: 7:30 PM</p>
                  <p className="tiempo-restante">En 4h 45min</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-ver-reserva">Ver Reserva</button>
                  <button className="boton-cancelar-reserva">Cancelar</button>
                </div>
              </div>

              <div className="tarjeta-mesa-admin ocupada">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 6</span>
                  <span className="capacidad-mesa-admin">4 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado ocupada">Ocupada</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="cliente-actual">Cliente: Ana López</p>
                  <p className="tiempo-ocupada">Ocupada: 35min</p>
                  <p className="orden-estado">Orden: En preparación</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-ver-orden">Ver Orden</button>
                  <button className="boton-cuenta" disabled>Generar Cuenta</button>
                </div>
              </div>

              <div className="tarjeta-mesa-admin limpieza">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 7</span>
                  <span className="capacidad-mesa-admin">4 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado limpieza">En Limpieza</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="tiempo-limpieza">Limpieza iniciada hace 5 min</p>
                  <p className="personal-limpieza">Personal: Roberto</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-finalizar-limpieza">Finalizar Limpieza</button>
                </div>
              </div>
            </div>
          </div>

          {/* Mesas para 6+ personas */}
          <div className="grupo-mesas-admin">
            <h3 className="titulo-grupo-mesas">Mesas para 6+ Personas</h3>
            <div className="grilla-mesas-admin">
              
              <div className="tarjeta-mesa-admin ocupada">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 8</span>
                  <span className="capacidad-mesa-admin">6 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado ocupada">Ocupada</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="cliente-actual">Cliente: Familia Rodríguez</p>
                  <p className="tiempo-ocupada">Ocupada: 1h 10min</p>
                  <p className="orden-estado">Orden: Servida</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-ver-orden">Ver Orden</button>
                  <button className="boton-cuenta">Generar Cuenta</button>
                </div>
              </div>

              <div className="tarjeta-mesa-admin reservada">
                <div className="header-mesa-admin">
                  <span className="numero-mesa-admin">Mesa 9</span>
                  <span className="capacidad-mesa-admin">8 personas</span>
                </div>
                <div className="estado-mesa-admin">
                  <span className="indicador-estado reservada">Reservada</span>
                </div>
                <div className="info-mesa-admin">
                  <p className="cliente-reserva">Reserva: Evento Empresa XYZ</p>
                  <p className="hora-reserva">Hora: 8:00 PM</p>
                  <p className="tipo-evento">Evento corporativo</p>
                </div>
                <div className="acciones-mesa-admin">
                  <button className="boton-ver-reserva">Ver Detalles</button>
                  <button className="boton-preparar-evento">Preparar Evento</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cola de espera actual */}
      <section className="seccion-cola-espera-admin">
        <div className="contenedor-cola-admin">
          <h2 className="titulo-seccion-mesas">Cola de Espera Virtual</h2>
          <div className="lista-cola-admin">
            
            <div className="cliente-cola-admin">
              <div className="info-cliente-cola">
                <span className="posicion-cliente">1°</span>
                <span className="nombre-cliente">María Sánchez</span>
                <span className="telefono-cliente">099-111-2222</span>
                <span className="personas-cliente">4 personas</span>
                <span className="tiempo-espera-cliente">Esperando: 15 min</span>
              </div>
              <div className="acciones-cliente-cola">
                <button className="boton-asignar-mesa">Asignar Mesa</button>
                <button className="boton-llamar-cliente">📞 Llamar</button>
                <button className="boton-eliminar-cola">❌ Eliminar</button>
              </div>
            </div>

            <div className="cliente-cola-admin">
              <div className="info-cliente-cola">
                <span className="posicion-cliente">2°</span>
                <span className="nombre-cliente">Carlos Morales</span>
                <span className="telefono-cliente">099-333-4444</span>
                <span className="personas-cliente">2 personas</span>
                <span className="tiempo-espera-cliente">Esperando: 8 min</span>
              </div>
              <div className="acciones-cliente-cola">
                <button className="boton-asignar-mesa">Asignar Mesa</button>
                <button className="boton-llamar-cliente">📞 Llamar</button>
                <button className="boton-eliminar-cola">❌ Eliminar</button>
              </div>
            </div>

            <div className="cliente-cola-admin">
              <div className="info-cliente-cola">
                <span className="posicion-cliente">3°</span>
                <span className="nombre-cliente">Ana López</span>
                <span className="telefono-cliente">099-555-6666</span>
                <span className="personas-cliente">6 personas</span>
                <span className="tiempo-espera-cliente">Esperando: 3 min</span>
              </div>
              <div className="acciones-cliente-cola">
                <button className="boton-asignar-mesa">Asignar Mesa</button>
                <button className="boton-llamar-cliente">📞 Llamar</button>
                <button className="boton-eliminar-cola">❌ Eliminar</button>
              </div>
            </div>

            <div className="cliente-cola-admin">
              <div className="info-cliente-cola">
                <span className="posicion-cliente">4°</span>
                <span className="nombre-cliente">Roberto Pérez</span>
                <span className="telefono-cliente">099-777-8888</span>
                <span className="personas-cliente">3 personas</span>
                <span className="tiempo-espera-cliente">Esperando: 1 min</span>
              </div>
              <div className="acciones-cliente-cola">
                <button className="boton-asignar-mesa">Asignar Mesa</button>
                <button className="boton-llamar-cliente">📞 Llamar</button>
                <button className="boton-eliminar-cola">❌ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
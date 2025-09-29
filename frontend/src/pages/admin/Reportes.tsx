import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/Reportes.css";

export default function Reportes() {
  return (
    <div className="reportes-admin">
      <NavbarAdmin />
      
      {/* Header de reportes */}
      <section className="header-reportes">
        <div className="contenedor-header-reportes">
          <h1 className="titulo-reportes">Reportes y Análisis</h1>
          <p className="subtitulo-reportes">Análisis detallado del rendimiento del restaurante</p>
          <div className="filtros-reportes">
            <select className="selector-periodo">
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="trimestre">Este Trimestre</option>
              <option value="personalizado">Período Personalizado</option>
            </select>
            <button className="boton-exportar-reporte">📊 Exportar Reporte</button>
            <button className="boton-imprimir">🖨️ Imprimir</button>
          </div>
        </div>
      </section>

      {/* Resumen ejecutivo */}
      <section className="seccion-resumen-ejecutivo">
        <div className="contenedor-resumen-ejecutivo">
          <h2 className="titulo-seccion-reportes">Resumen Ejecutivo - Hoy</h2>
          <div className="grilla-metricas-principales">
            
            <div className="tarjeta-metrica ventas-totales">
              <div className="icono-metrica ventas"></div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Ventas Totales</h3>
                <p className="valor-metrica">$2,847.50</p>
                <div className="comparacion-metrica">
                  <span className="cambio positivo">+15.3%</span>
                  <span className="referencia">vs. ayer ($2,468.20)</span>
                </div>
              </div>
            </div>

            <div className="tarjeta-metrica ordenes-completadas">
              <div className="icono-metrica ordenes"></div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Órdenes Completadas</h3>
                <p className="valor-metrica">47</p>
                <div className="comparacion-metrica">
                  <span className="cambio positivo">+8</span>
                  <span className="referencia">vs. ayer (39 órdenes)</span>
                </div>
              </div>
            </div>

            <div className="tarjeta-metrica ticket-promedio">
              <div className="icono-metrica ticket"></div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Ticket Promedio</h3>
                <p className="valor-metrica">$60.60</p>
                <div className="comparacion-metrica">
                  <span className="cambio positivo">+2.1%</span>
                  <span className="referencia">vs. ayer ($59.30)</span>
                </div>
              </div>
            </div>

            <div className="tarjeta-metrica clientes-atendidos">
              <div className="icono-metrica clientes"></div>
              <div className="contenido-metrica">
                <h3 className="titulo-metrica">Clientes Atendidos</h3>
                <p className="valor-metrica">134</p>
                <div className="comparacion-metrica">
                  <span className="cambio neutro">+2</span>
                  <span className="referencia">vs. ayer (132 clientes)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Análisis de ventas por hora */}
      <section className="seccion-ventas-hora">
        <div className="contenedor-ventas-hora">
          <h2 className="titulo-seccion-reportes">Ventas por Hora - Hoy</h2>
          <div className="grafico-ventas-hora">
            <div className="eje-y">
              <span className="valor-eje">$400</span>
              <span className="valor-eje">$300</span>
              <span className="valor-eje">$200</span>
              <span className="valor-eje">$100</span>
              <span className="valor-eje">$0</span>
            </div>
            <div className="barras-ventas">
              <div className="barra-hora">
                <div className="barra" style={{height: '25%'}}></div>
                <span className="hora-label">11AM</span>
                <span className="valor-hora">$78</span>
              </div>
              <div className="barra-hora">
                <div className="barra" style={{height: '45%'}}></div>
                <span className="hora-label">12PM</span>
                <span className="valor-hora">$156</span>
              </div>
              <div className="barra-hora pico">
                <div className="barra" style={{height: '80%'}}></div>
                <span className="hora-label">1PM</span>
                <span className="valor-hora">$289</span>
              </div>
              <div className="barra-hora pico">
                <div className="barra" style={{height: '85%'}}></div>
                <span className="hora-label">2PM</span>
                <span className="valor-hora">$312</span>
              </div>
              <div className="barra-hora">
                <div className="barra" style={{height: '30%'}}></div>
                <span className="hora-label">3PM</span>
                <span className="valor-hora">$98</span>
              </div>
              <div className="barra-hora">
                <div className="barra" style={{height: '15%'}}></div>
                <span className="hora-label">4PM</span>
                <span className="valor-hora">$45</span>
              </div>
              <div className="barra-hora">
                <div className="barra" style={{height: '35%'}}></div>
                <span className="hora-label">5PM</span>
                <span className="valor-hora">$125</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top platos más vendidos */}
      <section className="seccion-platos-top">
        <div className="contenedor-platos-top">
          <h2 className="titulo-seccion-reportes">Top 10 - Platos Más Vendidos Hoy</h2>
          <div className="lista-platos-top">
            
            <div className="item-plato-top position-1">
              <span className="posicion-plato">1</span>
              <div className="info-plato-top">
                <h3 className="nombre-plato-top">Alitas BBQ Clásicas</h3>
                <p className="categoria-plato-top">Alitas</p>
              </div>
              <div className="metricas-plato-top">
                <span className="cantidad-vendida">23 órdenes</span>
                <span className="ingresos-plato">$206.77</span>
                <span className="porcentaje-ventas">7.3% del total</span>
              </div>
            </div>

            <div className="item-plato-top position-2">
              <span className="posicion-plato">2</span>
              <div className="info-plato-top">
                <h3 className="nombre-plato-top">Chuwue Clásica</h3>
                <p className="categoria-plato-top">Hamburguesas</p>
              </div>
              <div className="metricas-plato-top">
                <span className="cantidad-vendida">18 órdenes</span>
                <span className="ingresos-plato">$189.00</span>
                <span className="porcentaje-ventas">6.6% del total</span>
              </div>
            </div>

            <div className="item-plato-top position-3">
              <span className="posicion-plato">3</span>
              <div className="info-plato-top">
                <h3 className="nombre-plato-top">Parrillada Individual</h3>
                <p className="categoria-plato-top">Parrilladas</p>
              </div>
              <div className="metricas-plato-top">
                <span className="cantidad-vendida">12 órdenes</span>
                <span className="ingresos-plato">$191.88</span>
                <span className="porcentaje-ventas">6.7% del total</span>
              </div>
            </div>

            <div className="item-plato-top">
              <span className="posicion-plato">4</span>
              <div className="info-plato-top">
                <h3 className="nombre-plato-top">Alitas Buffalo Picantes</h3>
                <p className="categoria-plato-top">Alitas</p>
              </div>
              <div className="metricas-plato-top">
                <span className="cantidad-vendida">15 órdenes</span>
                <span className="ingresos-plato">$142.50</span>
                <span className="porcentaje-ventas">5.0% del total</span>
              </div>
            </div>

            <div className="item-plato-top">
              <span className="posicion-plato">5</span>
              <div className="info-plato-top">
                <h3 className="nombre-plato-top">BBQ Bacon Burger</h3>
                <p className="categoria-plato-top">Hamburguesas</p>
              </div>
              <div className="metricas-plato-top">
                <span className="cantidad-vendida">11 órdenes</span>
                <span className="ingresos-plato">$142.89</span>
                <span className="porcentaje-ventas">5.0% del total</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Análisis de ocupación de mesas */}
      <section className="seccion-ocupacion-mesas">
        <div className="contenedor-ocupacion">
          <h2 className="titulo-seccion-reportes">Análisis de Ocupación de Mesas</h2>
          <div className="grilla-ocupacion">
            
            <div className="tarjeta-ocupacion">
              <h3 className="titulo-ocupacion">Ocupación Promedio</h3>
              <div className="grafico-circular">
                <div className="circulo-progreso" data-porcentaje="72">
                  <span className="porcentaje-ocupacion">72%</span>
                </div>
              </div>
              <p className="detalle-ocupacion">6.5 horas promedio por mesa</p>
            </div>

            <div className="tarjeta-ocupacion">
              <h3 className="titulo-ocupacion">Hora Pico</h3>
              <div className="info-hora-pico">
                <span className="horario-pico">1:00 PM - 3:00 PM</span>
                <span className="ocupacion-pico">95% ocupación</span>
              </div>
              <p className="detalle-ocupacion">Tiempo promedio espera: 25 min</p>
            </div>

            <div className="tarjeta-ocupacion">
              <h3 className="titulo-ocupacion">Rotación de Mesas</h3>
              <div className="info-rotacion">
                <span className="numero-rotacion">2.8</span>
                <span className="unidad-rotacion">rotaciones/día</span>
              </div>
              <p className="detalle-ocupacion">+0.3 vs. ayer</p>
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
              <h3 className="titulo-reserva-metrica">Tasa de Confirmación</h3>
              <p className="valor-reserva-metrica">85%</p>
              <span className="detalle-reserva-metrica">12 de 14 reservas confirmadas</span>
            </div>

            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">Puntualidad</h3>
              <p className="valor-reserva-metrica">78%</p>
              <span className="detalle-reserva-metrica">Llegan en horario o antes</span>
            </div>

            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">No Shows</h3>
              <p className="valor-reserva-metrica">1</p>
              <span className="detalle-reserva-metrica">7% del total de reservas</span>
            </div>

            <div className="tarjeta-reserva-metrica">
              <h3 className="titulo-reserva-metrica">Tiempo Promedio</h3>
              <p className="valor-reserva-metrica">1h 45min</p>
              <span className="detalle-reserva-metrica">Por mesa reservada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Análisis financiero */}
      <section className="seccion-analisis-financiero">
        <div className="contenedor-financiero">
          <h2 className="titulo-seccion-reportes">Análisis Financiero - Comparativo</h2>
          <div className="tabla-comparativa">
            <table className="tabla-reportes">
              <thead>
                <tr className="header-tabla">
                  <th className="columna-periodo">Período</th>
                  <th className="columna-ventas">Ventas</th>
                  <th className="columna-ordenes">Órdenes</th>
                  <th className="columna-ticket">Ticket Promedio</th>
                  <th className="columna-clientes">Clientes</th>
                  <th className="columna-cambio">Cambio %</th>
                </tr>
              </thead>
              <tbody>
                <tr className="fila-actual">
                  <td className="periodo">Hoy</td>
                  <td className="ventas">$2,847.50</td>
                  <td className="ordenes">47</td>
                  <td className="ticket">$60.60</td>
                  <td className="clientes">134</td>
                  <td className="cambio positivo">+15.3%</td>
                </tr>
                <tr className="fila-comparacion">
                  <td className="periodo">Ayer</td>
                  <td className="ventas">$2,468.20</td>
                  <td className="ordenes">39</td>
                  <td className="ticket">$59.30</td>
                  <td className="clientes">132</td>
                  <td className="cambio neutro">-</td>
                </tr>
                <tr className="fila-comparacion">
                  <td className="periodo">Promedio Semanal</td>
                  <td className="ventas">$2,654.80</td>
                  <td className="ordenes">42</td>
                  <td className="ticket">$58.90</td>
                  <td className="clientes">128</td>
                  <td className="cambio positivo">+7.3%</td>
                </tr>
                <tr className="fila-comparacion">
                  <td className="periodo">Mismo Día Semana Pasada</td>
                  <td className="ventas">$2,156.30</td>
                  <td className="ordenes">35</td>
                  <td className="ticket">$55.20</td>
                  <td className="clientes">118</td>
                  <td className="cambio positivo">+32.1%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recomendaciones */}
      <section className="seccion-recomendaciones">
        <div className="contenedor-recomendaciones">
          <h2 className="titulo-seccion-reportes">Recomendaciones del Sistema</h2>
          <div className="lista-recomendaciones">
            
            <div className="recomendacion alta-prioridad">
              <div className="icono-recomendacion alerta"></div>
              <div className="contenido-recomendacion">
                <h3 className="titulo-recomendacion">Reabastecer Inventario</h3>
                <p className="descripcion-recomendacion">
                  Alitas Honey Mustard y Costillas BBQ tienen bajo inventario. Reabastecer antes del fin de semana.
                </p>
                <span className="prioridad alta">Alta Prioridad</span>
              </div>
            </div>

            <div className="recomendacion media-prioridad">
              <div className="icono-recomendacion sugerencia"></div>
              <div className="contenido-recomendacion">
                <h3 className="titulo-recomendacion">Optimizar Horario Pico</h3>
                <p className="descripcion-recomendacion">
                  Considerar agregar personal extra entre 1-3 PM para reducir tiempos de espera.
                </p>
                <span className="prioridad media">Media Prioridad</span>
              </div>
            </div>

            <div className="recomendacion baja-prioridad">
              <div className="icono-recomendacion info"></div>
              <div className="contenido-recomendacion">
                <h3 className="titulo-recomendacion">Promocionar Platos Menos Vendidos</h3>
                <p className="descripcion-recomendacion">
                  El Vino Tinto y algunos postres tienen bajas ventas. Considerar promociones especiales.
                </p>
                <span className="prioridad baja">Baja Prioridad</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
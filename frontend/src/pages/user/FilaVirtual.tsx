import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/FilaVirtual.css";

export default function FilaVirtual() {
    return (
        <div>
            <Navbar />
            
            {/* Banner de la fila virtual */}
            <section className="banner-fila-virtual">
                <div className="contenedor-banner-fila">
                    <h1 className="titulo-fila-virtual">Fila Virtual</h1>
                    <p className="subtitulo-fila-virtual">Consulta disponibilidad y únete a la cola de espera</p>
                </div>
            </section>

            {/* Estado actual del restaurante */}
            <section className="seccion-estado-restaurante">
                <div className="contenedor-estado">
                    <div className="tarjeta-estado-principal">
                        <div className="indicador-abierto"></div>
                        <h2 className="titulo-estado">Restaurante Abierto</h2>
                        <p className="horario-actual">Horario hoy: 11:00 AM - 10:00 PM</p>
                        <p className="actualizacion">Última actualización: hace 2 minutos</p>
                    </div>
                </div>
            </section>

            {/* Disponibilidad de mesas en tiempo real */}
            <section className="seccion-disponibilidad-mesas">
                <div className="contenedor-disponibilidad">
                    <h2 className="titulo-disponibilidad">Estado de Mesas en Tiempo Real</h2>
                    
                    <div className="grilla-mesas">
                        {/* Mesas para 2 personas */}
                        <div className="grupo-mesas">
                            <h3 className="titulo-grupo-mesa">Mesas para 2 personas</h3>
                            <div className="lista-mesas">
                                <div className="tarjeta-mesa disponible">
                                    <span className="numero-mesa">Mesa 1</span>
                                    <span className="estado-mesa">Disponible</span>
                                    <button className="boton-tomar-mesa">Tomar Mesa</button>
                                </div>
                                <div className="tarjeta-mesa ocupada">
                                    <span className="numero-mesa">Mesa 2</span>
                                    <span className="estado-mesa">Ocupada</span>
                                    <span className="tiempo-estimado">~30 min</span>
                                </div>
                                <div className="tarjeta-mesa disponible">
                                    <span className="numero-mesa">Mesa 3</span>
                                    <span className="estado-mesa">Disponible</span>
                                    <button className="boton-tomar-mesa">Tomar Mesa</button>
                                </div>
                            </div>
                        </div>

                        {/* Mesas para 4 personas */}
                        <div className="grupo-mesas">
                            <h3 className="titulo-grupo-mesa">Mesas para 4 personas</h3>
                            <div className="lista-mesas">
                                <div className="tarjeta-mesa ocupada">
                                    <span className="numero-mesa">Mesa 4</span>
                                    <span className="estado-mesa">Ocupada</span>
                                    <span className="tiempo-estimado">~45 min</span>
                                </div>
                                <div className="tarjeta-mesa reservada">
                                    <span className="numero-mesa">Mesa 5</span>
                                    <span className="estado-mesa">Reservada</span>
                                    <span className="tiempo-estimado">7:30 PM</span>
                                </div>
                                <div className="tarjeta-mesa ocupada">
                                    <span className="numero-mesa">Mesa 6</span>
                                    <span className="estado-mesa">Ocupada</span>
                                    <span className="tiempo-estimado">~25 min</span>
                                </div>
                                <div className="tarjeta-mesa limpieza">
                                    <span className="numero-mesa">Mesa 7</span>
                                    <span className="estado-mesa">En limpieza</span>
                                    <span className="tiempo-estimado">~5 min</span>
                                </div>
                            </div>
                        </div>

                        {/* Mesas para 6+ personas */}
                        <div className="grupo-mesas">
                            <h3 className="titulo-grupo-mesa">Mesas para 6+ personas</h3>
                            <div className="lista-mesas">
                                <div className="tarjeta-mesa ocupada">
                                    <span className="numero-mesa">Mesa 8</span>
                                    <span className="estado-mesa">Ocupada</span>
                                    <span className="tiempo-estimado">~60 min</span>
                                </div>
                                <div className="tarjeta-mesa reservada">
                                    <span className="numero-mesa">Mesa 9</span>
                                    <span className="estado-mesa">Reservada</span>
                                    <span className="tiempo-estimado">8:00 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sistema de cola de espera */}
            <section className="seccion-cola-espera">
                <div className="contenedor-cola">
                    <h2 className="titulo-cola">Sistema de Cola de Espera</h2>
                    <p className="descripcion-cola">
                        Si no hay mesas disponibles, únete a nuestra fila virtual y te notificaremos cuando sea tu turno
                    </p>

                    {/* Formulario para unirse a la cola */}
                    <div className="formulario-cola">
                        <h3 className="titulo-formulario-cola">Únete a la Cola Virtual</h3>
                        <form className="form-cola">
                            <div className="campo-cola">
                                <label className="etiqueta-cola">Nombre</label>
                                <input type="text" className="input-cola" placeholder="Tu nombre completo" />
                            </div>
                            <div className="campo-cola">
                                <label className="etiqueta-cola">Teléfono</label>
                                <input type="tel" className="input-cola" placeholder="099-123-4567" />
                            </div>
                            <div className="campo-cola">
                                <label className="etiqueta-cola">Número de personas</label>
                                <select className="select-cola">
                                    <option value="2">2 personas</option>
                                    <option value="3">3 personas</option>
                                    <option value="4">4 personas</option>
                                    <option value="5">5 personas</option>
                                    <option value="6">6 personas</option>
                                    <option value="8">8+ personas</option>
                                </select>
                            </div>
                            <button type="submit" className="boton-unirse-cola">
                                Unirse a la Cola Virtual
                            </button>
                        </form>
                    </div>

                    {/* Estado actual de la cola */}
                    <div className="estado-cola-actual">
                        <h3 className="titulo-estado-cola">Cola Actual</h3>
                        <div className="lista-cola">
                            <div className="persona-en-cola">
                                <span className="posicion-cola">1°</span>
                                <span className="nombre-cola">María S.</span>
                                <span className="personas-cola">4 personas</span>
                                <span className="tiempo-cola">Tiempo estimado: 15 min</span>
                            </div>
                            <div className="persona-en-cola">
                                <span className="posicion-cola">2°</span>
                                <span className="nombre-cola">Carlos M.</span>
                                <span className="personas-cola">2 personas</span>
                                <span className="tiempo-cola">Tiempo estimado: 30 min</span>
                            </div>
                            <div className="persona-en-cola">
                                <span className="posicion-cola">3°</span>
                                <span className="nombre-cola">Ana L.</span>
                                <span className="personas-cola">6 personas</span>
                                <span className="tiempo-cola">Tiempo estimado: 45 min</span>
                            </div>
                            <div className="persona-en-cola">
                                <span className="posicion-cola">4°</span>
                                <span className="nombre-cola">Roberto P.</span>
                                <span className="personas-cola">3 personas</span>
                                <span className="tiempo-cola">Tiempo estimado: 50 min</span>
                            </div>
                        </div>
                        <p className="total-espera">
                            Si te unes ahora, serías el <strong>5°</strong> en la cola con un tiempo estimado de <strong>55 minutos</strong>
                        </p>
                    </div>
                </div>
            </section>

            {/* Información sobre notificaciones */}
            <section className="seccion-notificaciones">
                <div className="contenedor-notificaciones">
                    <div className="tarjeta-notificaciones">
                        <h3 className="titulo-notificaciones">¿Cómo funcionan las notificaciones?</h3>
                        <ul className="lista-notificaciones">
                            <li className="item-notificacion">
                                📱 Te enviaremos un SMS cuando falten 10 minutos para tu turno
                            </li>
                            <li className="item-notificacion">
                                🔔 Recibirás una segunda notificación cuando tu mesa esté lista
                            </li>
                            <li className="item-notificacion">
                                ⏰ Tendrás 15 minutos para confirmar tu llegada al restaurante
                            </li>
                            <li className="item-notificacion">
                                🚫 Si no confirmas, tu turno pasará al siguiente cliente
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Tiempos estimados por tipo de mesa */}
            <section className="seccion-tiempos-estimados">
                <div className="contenedor-tiempos">
                    <h2 className="titulo-tiempos">Tiempos Promedio de Espera</h2>
                    <div className="grilla-tiempos">
                        <div className="tarjeta-tiempo">
                            <span className="tipo-mesa-tiempo">Mesa para 2</span>
                            <span className="tiempo-promedio">15-25 min</span>
                            <span className="estado-tiempo disponible">Disponible ahora</span>
                        </div>
                        <div className="tarjeta-tiempo">
                            <span className="tipo-mesa-tiempo">Mesa para 4</span>
                            <span className="tiempo-promedio">25-40 min</span>
                            <span className="estado-tiempo espera">4 personas esperando</span>
                        </div>
                        <div className="tarjeta-tiempo">
                            <span className="tipo-mesa-tiempo">Mesa para 6+</span>
                            <span className="tiempo-promedio">45-60 min</span>
                            <span className="estado-tiempo espera">1 persona esperando</span>
                        </div>
                    </div>
                </div>
            </section>

            <PiePagina />
        </div>
    );
}
import { useState, useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import { MesasMap } from "../../components/user/MesasMap";
import { wsService } from "../../services/WebSocketService";
import { apiService } from "../../services/ApiService";
import "../../css/user/FilaVirtual.css";

interface Mesa {
    id: number;
    numero: number;
    capacidad: number;
    estado: string;
    ubicacion: string;
}

interface PersonaEnCola {
    id: number;
    nombre: string;
    telefono: string;
    numeroPersonas: number;
    posicion: number;
    tiempoEstimado: number;
}

export default function FilaVirtual() {
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [cola, setCola] = useState<PersonaEnCola[]>([]);
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        numeroPersonas: 2
    });

    useEffect(() => {
        // Conectar al WebSocket
        wsService.connect();

            // Cargar mesas iniciales
            cargarMesas();
            cargarCola();

        // Suscribirse a actualizaciones de mesas
        const unsubscribeMesas = wsService.subscribe('mesas', (message: any) => {
            console.log('Actualización de mesas:', message);
            cargarMesas(); // Recargar mesas cuando hay cambios
        });

        // Suscribirse a actualizaciones de fila virtual
        const unsubscribeFila = wsService.subscribe('fila_virtual', (message: any) => {
            console.log('Actualización de fila virtual:', message);
            cargarCola(); // Recargar cola cuando hay cambios
        });

        return () => {
            unsubscribeMesas();
            unsubscribeFila();
            // No desconectamos el WebSocket aquí para que otras páginas puedan usarlo
        };
    }, []);

    const cargarMesas = async () => {
        try {
            const data = await apiService.getMesas();
            // El backend devuelve 'id_mesa' mientras el componente espera 'id'
            const mapped = (data || []).map((m: any) => ({
                id: m.id_mesa ?? m.id ?? Math.floor(Math.random() * 1000000),
                numero: m.numero,
                capacidad: m.capacidad,
                estado: m.estado,
                ubicacion: m.ubicacion ?? ''
            }));
            setMesas(mapped);
        } catch (error) {
            console.error('Error al cargar mesas:', error);
        }
    };

    const cargarCola = async () => {
        try {
            // Usar el servicio API centralizado para evitar endpoints incorrectos
            const data = await apiService.getFilaVirtual();
            setCola(data || []);
        } catch (error) {
            console.error('Error al cargar cola:', error);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'numeroPersonas' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        try {
            // Crear entrada en la fila virtual via API REST
            // Usar ApiService para crear la entrada en la fila virtual
            const payload = {
                cliente_id: Math.floor(Math.random() * 1000), // Generar ID temporal
                ...formData,
                hora_llegada: new Date().toISOString(),
                estado: 'esperando'
            };

            const data = await apiService.unirseFilaVirtual(payload);

            // Si la API devolvió el recurso creado, notificar por WebSocket
            if (data) {
                try {
                    const createdId = (data && data.id) ? data.id : undefined;
                    if (createdId) {
                        wsService.joinFilaVirtual(createdId, formData.nombre);
                    } else {
                        // Intentar enviar sin id si no se devolvió (el servidor puede aceptar)
                        wsService.joinFilaVirtual(Math.floor(Math.random() * 1000000), formData.nombre);
                    }
                } catch (wsErr) {
                    console.warn('Advertencia: no se pudo notificar por WebSocket:', wsErr);
                }

                alert('¡Te has unido a la cola virtual! Te notificaremos cuando sea tu turno.');
                setFormData({ nombre: '', telefono: '', numeroPersonas: 2 });
                cargarCola();
            }
        } catch (error) {
            console.error('Error al unirse a la cola:', error);
            alert('Error al unirse a la cola. Por favor intenta de nuevo.');
        }
    };

    const mesasPor2 = mesas.filter(m => m.capacidad === 2);
    const mesasPor4 = mesas.filter(m => m.capacidad === 4);
    const mesasPor6Plus = mesas.filter(m => m.capacidad >= 6);

    const getEstadoClase = (estado: string) => {
        return estado.toLowerCase().replace(' ', '-');
    };

    const getEstadoTexto = (estado: string) => {
        const estados: any = {
            'libre': 'Disponible',
            'ocupada': 'Ocupada',
            'reservada': 'Reservada',
            'limpieza': 'En limpieza'
        };
        return estados[estado] || estado;
    };

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
                        <p className="actualizacion">
                            🔴 Actualizaciones en tiempo real • Conectado
                        </p>
                    </div>
                </div>
            </section>

            {/* Disponibilidad de mesas en tiempo real */}
            <section className="seccion-disponibilidad-mesas">
                <div className="contenedor-disponibilidad">
                    <h2 className="titulo-disponibilidad">Estado de Mesas en Tiempo Real</h2>
                    <p className="descripcion-disponibilidad">
                        Visualiza el salón como si fuera un cine: cada mesa cambia de color según su disponibilidad
                        y se actualiza en tiempo real cuando alguien reserva, ocupa o libera un espacio.
                    </p>
                    <MesasMap mesas={mesas} />
                    
                    <div className="grilla-mesas">
                        {/* Mesas para 2 personas */}
                        <div className="grupo-mesas">
                            <h3 className="titulo-grupo-mesa">Mesas para 2 personas</h3>
                            <div className="lista-mesas">
                                {mesasPor2.length > 0 ? mesasPor2.map(mesa => (
                                    <div key={mesa.id} className={`tarjeta-mesa ${getEstadoClase(mesa.estado)}`}>
                                        <span className="numero-mesa">Mesa {mesa.numero}</span>
                                        <span className="estado-mesa">{getEstadoTexto(mesa.estado)}</span>
                                        {mesa.estado === 'libre' && (
                                            <button className="boton-tomar-mesa">Tomar Mesa</button>
                                        )}
                                    </div>
                                )) : <p>No hay mesas de 2 personas</p>}
                            </div>
                        </div>

                        {/* Mesas para 4 personas */}
                        <div className="grupo-mesas">
                            <h3 className="titulo-grupo-mesa">Mesas para 4 personas</h3>
                            <div className="lista-mesas">
                                {mesasPor4.length > 0 ? mesasPor4.map(mesa => (
                                    <div key={mesa.id} className={`tarjeta-mesa ${getEstadoClase(mesa.estado)}`}>
                                        <span className="numero-mesa">Mesa {mesa.numero}</span>
                                        <span className="estado-mesa">{getEstadoTexto(mesa.estado)}</span>
                                        {mesa.estado === 'libre' && (
                                            <button className="boton-tomar-mesa">Tomar Mesa</button>
                                        )}
                                    </div>
                                )) : <p>No hay mesas de 4 personas</p>}
                            </div>
                        </div>

                        {/* Mesas para 6+ personas */}
                        <div className="grupo-mesas">
                            <h3 className="titulo-grupo-mesa">Mesas para 6+ personas</h3>
                            <div className="lista-mesas">
                                {mesasPor6Plus.length > 0 ? mesasPor6Plus.map(mesa => (
                                    <div key={mesa.id} className={`tarjeta-mesa ${getEstadoClase(mesa.estado)}`}>
                                        <span className="numero-mesa">Mesa {mesa.numero}</span>
                                        <span className="estado-mesa">{getEstadoTexto(mesa.estado)}</span>
                                        {mesa.estado === 'libre' && (
                                            <button className="boton-tomar-mesa">Tomar Mesa</button>
                                        )}
                                    </div>
                                )) : <p>No hay mesas de 6+ personas</p>}
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
                        <form className="form-cola" onSubmit={handleSubmit}>
                            <div className="campo-cola">
                                <label className="etiqueta-cola">Nombre</label>
                                <input 
                                    type="text" 
                                    name="nombre"
                                    className="input-cola" 
                                    placeholder="Tu nombre completo" 
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="campo-cola">
                                <label className="etiqueta-cola">Teléfono</label>
                                <input 
                                    type="tel" 
                                    name="telefono"
                                    className="input-cola" 
                                    placeholder="099-123-4567"
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="campo-cola">
                                <label className="etiqueta-cola">Número de personas</label>
                                <select 
                                    name="numeroPersonas"
                                    className="select-cola"
                                    value={formData.numeroPersonas}
                                    onChange={handleInputChange}
                                >
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
                            {cola.length > 0 ? cola.map((persona, index) => (
                                <div key={persona.id ?? `cola-${index}`} className="persona-en-cola">
                                    <span className="posicion-cola">{index + 1}°</span>
                                    <span className="nombre-cola">{persona.nombre}</span>
                                    <span className="personas-cola">{persona.numeroPersonas} personas</span>
                                    <span className="tiempo-cola">Tiempo estimado: {(index + 1) * 15} min</span>
                                </div>
                            )) : (
                                <p>No hay personas en cola actualmente</p>
                            )}
                        </div>
                        {cola.length > 0 && (
                            <p className="total-espera">
                                Si te unes ahora, serías el <strong>{cola.length + 1}°</strong> en la cola con un tiempo estimado de <strong>{(cola.length + 1) * 15} minutos</strong>
                            </p>
                        )}
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
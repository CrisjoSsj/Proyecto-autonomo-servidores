import { useState, useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import { apiService } from "../../services/ApiService";
import "../../css/user/FilaVirtual.css";

export default function FilaVirtualConAPI() {
  // Estados para los datos
  const [filas, setFilas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uniendoseAFila, setUniendoseAFila] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    id_cliente: 1,
    posicion: 1,
    tiempo_espera: "15 min",
    estado: 'esperando'
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        console.log('Cargando datos para fila virtual...');
        
        const [filasData, clientesData] = await Promise.all([
          apiService.getFilas(),
          apiService.getClientes()
        ]);

        console.log('Filas:', filasData);
        console.log('Clientes:', clientesData);

        setFilas(filasData);
        setClientes(clientesData);
        
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error conectando con la API. ¿Está ejecutándose en http://localhost:8000?');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUnirseAFila = async (e: any) => {
    e.preventDefault();
    setUniendoseAFila(true);
    setMensaje(null);

    try {
      // Calcular siguiente posición
      const siguientePosicion = filas.length > 0 ? Math.max(...filas.map(f => f.posicion)) + 1 : 1;
      
      const nuevaFila = {
        id_fila: Date.now(), // ID temporal
        ...formData,
        posicion: siguientePosicion,
        tiempo_espera: `${siguientePosicion * 15} min` // 15 minutos por posición como string
      };

      console.log('Uniéndose a fila:', nuevaFila);
      
      const resultado = await apiService.crearFila(nuevaFila);
      console.log('Posición en fila creada:', resultado);
      
      setMensaje(`¡Te has unido a la fila en la posición ${siguientePosicion}!`);
      
      // Recargar filas
      const filasActualizadas = await apiService.getFilas();
      setFilas(filasActualizadas);
      
      // Resetear formulario
      setFormData({
        id_cliente: 1,
        posicion: 1,
        tiempo_espera: "15 min",
        estado: 'esperando'
      });

    } catch (error) {
      console.error('Error uniéndose a fila:', error);
      setMensaje('Error al unirse a la fila. Intenta de nuevo.');
    } finally {
      setUniendoseAFila(false);
    }
  };

  const calcularTiempoEspera = (posicion: number) => {
    const minutos = posicion * 15;
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const minutosRestantes = minutos % 60;
      return `${horas}h ${minutosRestantes}min`;
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Cargando fila virtual...</h2>
          <p>Conectando con API REST</p>
        </div>
        <PiePagina />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>
          <h2>Error de Conexión</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
        <PiePagina />
      </div>
    );
  }

  // Ordenar filas por posición
  const filasOrdenadas = [...filas].sort((a, b) => a.posicion - b.posicion);

  return (
    <div>
      <Navbar />
      
      {/* Banner de fila virtual */}
      <section className="banner-fila-virtual">
        <div className="contenedor-banner-fila">
          <h1 className="titulo-fila-virtual">Fila Virtual - API REST</h1>
          <p className="subtitulo-fila-virtual">Sistema de espera inteligente en tiempo real</p>
          <div className="estadisticas-fila">
            <div className="stat-item">
              <span className="stat-numero">{filas.length}</span>
              <span className="stat-texto">en fila</span>
            </div>
            <div className="stat-item">
              <span className="stat-numero">{calcularTiempoEspera(filas.length + 1)}</span>
              <span className="stat-texto">tiempo estimado</span>
            </div>
            <div className="stat-item">
              <span className="stat-numero">🔄</span>
              <span className="stat-texto">API Conectada</span>
            </div>
          </div>
        </div>
      </section>

      <div className="contenedor-fila-virtual">
        {/* Formulario para unirse a la fila */}
        <section className="seccion-unirse-fila">
          <div className="contenedor-formulario-fila">
            <h2 className="titulo-unirse">Únete a la Fila Virtual</h2>
            
            {mensaje && (
              <div className={`mensaje-fila ${mensaje.includes('Error') ? 'error' : 'exito'}`}>
                {mensaje}
              </div>
            )}

            <form className="formulario-fila" onSubmit={handleUnirseAFila}>
              <div className="grupo-campo-fila">
                <label className="etiqueta-campo-fila" htmlFor="id_cliente">Selecciona Cliente</label>
                <select 
                  id="id_cliente" 
                  name="id_cliente"
                  className="campo-seleccion-fila"
                  value={formData.id_cliente}
                  onChange={handleChange}
                  required
                >
                  {clientes.map((cliente: any) => (
                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.nombre} - {cliente.telefono}
                    </option>
                  ))}
                </select>
              </div>

              <div className="info-posicion">
                <p>
                  <strong>Tu posición será:</strong> {filas.length + 1}
                </p>
                <p>
                  <strong>Tiempo estimado de espera:</strong> {calcularTiempoEspera(filas.length + 1)}
                </p>
              </div>

              <button 
                type="submit" 
                className="boton-unirse-fila"
                disabled={uniendoseAFila}
              >
                {uniendoseAFila ? 'Uniéndose a la fila...' : 'Unirse a la Fila'}
              </button>
            </form>
          </div>
        </section>

        {/* Estado actual de la fila */}
        <section className="seccion-estado-fila">
          <div className="contenedor-estado-fila">
            <h2 className="titulo-estado-fila">Estado Actual de la Fila desde API</h2>
            
            {filasOrdenadas.length > 0 ? (
              <div className="lista-fila-virtual">
                {filasOrdenadas.map((fila: any, index: number) => {
                  const cliente = clientes.find(c => c.id_cliente === fila.id_cliente);
                  
                  return (
                    <div 
                      key={fila.id_fila} 
                      className={`tarjeta-posicion-fila ${index === 0 ? 'siguiente' : ''}`}
                    >
                      <div className="numero-posicion">
                        {index === 0 ? '👑' : fila.posicion}
                      </div>
                      
                      <div className="info-cliente-fila">
                        <h3 className="nombre-cliente-fila">
                          {cliente ? cliente.nombre : `Cliente ${fila.id_cliente}`}
                        </h3>
                        <p className="telefono-cliente-fila">
                          {cliente ? cliente.telefono : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="info-espera">
                        <p className="tiempo-espera">
                          {fila.tiempo_espera}
                        </p>
                        <span className={`estado-fila ${fila.estado}`}>
                          {fila.estado.toUpperCase()}
                        </span>
                      </div>
                      
                      {index === 0 && (
                        <div className="indicator-siguiente">
                          ¡SIGUIENTE!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="fila-vacia">
                <div className="icono-fila-vacia">🎉</div>
                <h3>¡No hay fila!</h3>
                <p>Eres el primero en llegar. ¡Únete ahora!</p>
              </div>
            )}
          </div>
        </section>

        {/* Panel de información del sistema */}
        <section className="seccion-info-fila">
          <div className="contenedor-info-fila">
            <h2 className="titulo-info-fila">Información del Sistema</h2>
            
            <div className="grilla-info-fila">
              <div className="tarjeta-info-fila">
                <div className="icono-info-fila">👥</div>
                <h3 className="numero-info-fila">{filas.length}</h3>
                <p className="label-info-fila">Personas en Fila</p>
              </div>
              
              <div className="tarjeta-info-fila">
                <div className="icono-info-fila">⏱️</div>
                <h3 className="numero-info-fila">15</h3>
                <p className="label-info-fila">Min por Cliente</p>
              </div>
              
              <div className="tarjeta-info-fila">
                <div className="icono-info-fila">🔄</div>
                <h3 className="numero-info-fila">API</h3>
                <p className="label-info-fila">Tiempo Real</p>
              </div>
              
              <div className="tarjeta-info-fila">
                <div className="icono-info-fila">📱</div>
                <h3 className="numero-info-fila">24/7</h3>
                <p className="label-info-fila">Disponible</p>
              </div>
            </div>

            <div className="como-funciona">
              <h3>¿Cómo funciona?</h3>
              <ol>
                <li>Selecciona tu cliente y únete a la fila virtual</li>
                <li>Recibe tu posición y tiempo estimado de espera</li>
                <li>Monitorea tu progreso en tiempo real</li>
                <li>¡Serás notificado cuando sea tu turno!</li>
              </ol>
            </div>
          </div>
        </section>
      </div>

      <PiePagina />
    </div>
  );
}
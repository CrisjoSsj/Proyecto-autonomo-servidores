import { useState, useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import { apiService } from "../../services/ApiService";
import "../../css/user/Home.css";

export default function HomeSimpleAPI() {
  const [platos, setPlatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPlatos = async () => {
      try {
        setLoading(true);
        console.log('Conectando con API REST en http://localhost:8000...');
        
        const platosData = await apiService.getPlatos();
        console.log('Platos obtenidos:', platosData);
        
        setPlatos(platosData);
        
      } catch (err) {
        console.error('Error:', err);
        setError('Error conectando con la API. ¿Está ejecutándose en http://localhost:8000?');
      } finally {
        setLoading(false);
      }
    };

    cargarPlatos();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{padding: '3rem', textAlign: 'center'}}>
          <h2>Cargando datos desde API REST...</h2>
          <p>Conectando con http://localhost:8000</p>
        </div>
        <PiePagina />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div style={{padding: '3rem', textAlign: 'center', color: 'red'}}>
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

  return (
    <div>
      <Navbar />
      
      <section className="banner-principal">
        <div className="contenido-banner">
          <h1 className="titulo-principal">Chugue Grill - Conectado a API REST</h1>
          <p className="subtitulo-principal">Datos en tiempo real desde tu backend</p>
          
          <div className="estado-restaurante">
            <div className="indicador-estado abierto">
              <span className="texto-estado">API REST Conectada ✅</span>
              <span className="horario-estado">Datos actualizados en tiempo real</span>
            </div>
          </div>

          <div className="botones-principales">
            <a href="/menuapi" className="boton-primario">Ver Menú Dinámico</a>
            <a href="/reservasapi" className="boton-secundario">Sistema de Reservas</a>
          </div>
          
          <div className="botones-principales" style={{marginTop: '1rem'}}>
            <a href="/filaapi" className="boton-primario">Fila Virtual</a>
            <a href="/menu" className="boton-secundario">Ver Versión Estática</a>
          </div>
        </div>
      </section>

      <section className="seccion-platos-destacados">
        <div className="contenedor-platos-destacados">
          <h2 className="titulo-platos-destacados">Platos desde API REST</h2>
          <p className="descripcion-platos-destacados">
            Mostrando {platos.length} platos obtenidos directamente de tu backend
          </p>
          
          {platos.length > 0 ? (
            <div className="grilla-platos-destacados">
              {platos.slice(0, 6).map((plato: any) => (
                <div key={plato.id_plato} className="tarjeta-plato-destacado">
                  <div className="contenido-plato-destacado">
                    <h3 className="nombre-plato-destacado">{plato.nombre}</h3>
                    <p className="descripcion-plato-destacado">{plato.descripcion}</p>
                    <div className="info-plato-destacado">
                      <span className="precio-plato-destacado">${plato.precio}</span>
                      <span className="disponible-plato">
                        {plato.disponible ? '✅ Disponible' : '❌ No disponible'}
                      </span>
                    </div>
                    <span className="categoria-plato">ID Categoría: {plato.id_categoria}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{textAlign: 'center', padding: '2rem'}}>
              <h3>No hay platos disponibles</h3>
              <p>Asegúrate de que tu API REST tenga datos en la tabla de platos.</p>
            </div>
          )}
          
          <div className="ver-menu-completo">
            <a href="/menuapi" className="boton-ver-menu">Ver Menú Completo con API</a>
          </div>
        </div>
      </section>

      <section className="seccion-por-que-elegirnos">
        <div className="contenedor-por-que-elegirnos">
          <h2 className="titulo-por-que-elegirnos">Arquitectura del Proyecto</h2>
          <div className="grilla-razones">
            <div className="razon">
              <div className="icono-razon calidad"></div>
              <h3 className="titulo-razon">API REST Python</h3>
              <p className="descripcion-razon">FastAPI + Pydantic para validación de datos</p>
            </div>
            <div className="razon">
              <div className="icono-razon experiencia"></div>
              <h3 className="titulo-razon">Frontend React</h3>
              <p className="descripcion-razon">TypeScript + React 19 para una UI moderna</p>
            </div>
            <div className="razon">
              <div className="icono-razon ambiente"></div>
              <h3 className="titulo-razon">WebSocket Ruby</h3>
              <p className="descripcion-razon">Comunicación en tiempo real para fila virtual</p>
            </div>
          </div>
        </div>
      </section>

      <PiePagina />
    </div>
  );
}
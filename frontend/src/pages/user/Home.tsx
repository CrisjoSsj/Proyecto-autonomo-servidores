import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <Navbar />

      {/* Banner principal del restaurante */}
      <section className="banner-principal">
        <div className="banner-contenido">
          <h1 className="titulo-restaurante">Chuwue Grill</h1>
          <p className="descripcion-restaurante">Las mejores alitas y parrilladas de la ciudad</p>
          <p className="eslogan-restaurante">¡Sabor auténtico que te enamorará!</p>
        </div>
      </section>

      {/* Información importante del día */}
      <section className="seccion-informacion-importante">
        <div className="contenedor-informacion">
          <h2 className="titulo-informacion">Información Importante</h2>
          
          <div className="grilla-informacion">
            {/* Estado actual */}
            <div className="tarjeta-info estado-restaurante">
              <div className="icono-estado abierto"></div>
              <h3 className="titulo-tarjeta">Estamos Abiertos</h3>
              <p className="detalle-info">Hoy: 11:00 AM - 10:00 PM</p>
              <p className="disponibilidad">Mesas disponibles ahora</p>
            </div>

            {/* Promoción del día */}
            <div className="tarjeta-info promocion-dia">
              <div className="icono-promocion"></div>
              <h3 className="titulo-tarjeta">Promoción del Día</h3>
              <p className="detalle-info">2x1 en Alitas BBQ</p>
              <p className="condicion-promo">Válido hasta las 6:00 PM</p>
            </div>

            {/* Tiempo de espera actual */}
            <div className="tarjeta-info tiempo-espera">
              <div className="icono-tiempo"></div>
              <h3 className="titulo-tarjeta">Tiempo de Espera</h3>
              <p className="detalle-info">Aprox. 15 minutos</p>
              <p className="nota-tiempo">Para mesa de 2-4 personas</p>
            </div>

            {/* Reservas para hoy */}
            <div className="tarjeta-info reservas-hoy">
              <div className="icono-reservas"></div>
              <h3 className="titulo-tarjeta">Reservas Disponibles</h3>
              <p className="detalle-info">Horarios libres hoy</p>
              <p className="horarios-libres">7:30 PM, 8:00 PM, 9:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Acceso rápido a servicios */}
      <section className="seccion-acceso-rapido">
        <div className="contenedor-acceso">
          <h2 className="titulo-acceso">¿Qué deseas hacer?</h2>
          <div className="grilla-servicios">
            
            <Link to="/menu" className="tarjeta-servicio">
              <div className="icono-servicio menu"></div>
              <h3 className="titulo-servicio">Ver Menú</h3>
              <p className="descripcion-servicio">Explora nuestros deliciosos platos organizados por categorías</p>
            </Link>

            <Link to="/reservas" className="tarjeta-servicio">
              <div className="icono-servicio reservas"></div>
              <h3 className="titulo-servicio">Hacer Reserva</h3>
              <p className="descripcion-servicio">Reserva tu mesa con anticipación para fechas especiales</p>
            </Link>

            <Link to="/filavirtual" className="tarjeta-servicio">
              <div className="icono-servicio fila"></div>
              <h3 className="titulo-servicio">Fila Virtual</h3>
              <p className="descripcion-servicio">Consulta disponibilidad de mesas y únete a la cola de espera</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Platos más populares */}
      <section className="seccion-platos-populares">
        <div className="contenedor-populares">
          <h2 className="titulo-populares">Los Más Pedidos</h2>
          <div className="grilla-populares">
            <div className="tarjeta-plato-popular">
              <div className="imagen-plato alitas-bbq"></div>
              <h3 className="nombre-plato-popular">Alitas BBQ</h3>
              <p className="descripcion-popular">Nuestro plato estrella con salsa BBQ casera</p>
              <span className="precio-popular">$8.99</span>
            </div>
            
            <div className="tarjeta-plato-popular">
              <div className="imagen-plato hamburguesa"></div>
              <h3 className="nombre-plato-popular">Hamburguesa Chuwue</h3>
              <p className="descripcion-popular">Nuestra hamburguesa insignia con ingredientes premium</p>
              <span className="precio-popular">$12.99</span>
            </div>
            
            <div className="tarjeta-plato-popular">
              <div className="imagen-plato parrillada"></div>
              <h3 className="nombre-plato-popular">Parrillada Familiar</h3>
              <p className="descripcion-popular">Perfecta para compartir, incluye carnes mixtas</p>
              <span className="precio-popular">$24.99</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alertas e información adicional */}
      <section className="seccion-alertas">
        <div className="contenedor-alertas">
          <div className="alerta importante">
            <div className="icono-alerta"></div>
            <div className="contenido-alerta">
              <h3 className="titulo-alerta">¡Atención!</h3>
              <p className="mensaje-alerta">
                Los fines de semana recomendamos hacer reserva con anticipación. 
                El tiempo de espera puede ser mayor entre 7:00 PM - 9:00 PM.
              </p>
            </div>
          </div>
          
          <div className="alerta informativa">
            <div className="icono-alerta"></div>
            <div className="contenido-alerta">
              <h3 className="titulo-alerta">Nuevo servicio</h3>
              <p className="mensaje-alerta">
                Ahora puedes unirte a nuestra fila virtual y recibir notificaciones 
                cuando tu mesa esté lista.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PiePagina />
    </div>
  );
}

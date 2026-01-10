import Navbar from "../../components/user/Navbar";
import ReservaForm from "../../components/user/ReservaForm";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/Reservas.css";

export default function Reservas() {
  return (
    <div className="page-wrapper">
      <Navbar />
      
      {/* Hero de Reservas */}
      <section className="reservas-hero">
        <div className="reservas-hero-overlay"></div>
        <div className="reservas-hero-content">
          <p className="reservas-hero-tagline">Experiencia Premium</p>
          <h1 className="reservas-hero-title">Reserva tu Mesa</h1>
          <p className="reservas-hero-subtitle">
            Asegura tu lugar para una experiencia gastronómica inolvidable
          </p>
        </div>
      </section>

      {/* Ventajas */}
      <section className="reservas-benefits">
        <div className="section-container">
          <div className="benefits-grid">
            <div className="benefit-card">
              <span className="material-symbols-outlined benefit-icon">table_restaurant</span>
              <h3 className="benefit-title">Mesa Garantizada</h3>
              <p className="benefit-text">Tu mesa estará lista exactamente a la hora elegida</p>
            </div>
            <div className="benefit-card">
              <span className="material-symbols-outlined benefit-icon">schedule</span>
              <h3 className="benefit-title">Sin Esperas</h3>
              <p className="benefit-text">Acceso directo sin hacer cola al llegar</p>
            </div>
            <div className="benefit-card">
              <span className="material-symbols-outlined benefit-icon">star</span>
              <h3 className="benefit-title">Atención Premium</h3>
              <p className="benefit-text">Servicio prioritario durante toda tu visita</p>
            </div>
            <div className="benefit-card">
              <span className="material-symbols-outlined benefit-icon">celebration</span>
              <h3 className="benefit-title">Ocasiones Especiales</h3>
              <p className="benefit-text">Decoración personalizada para celebraciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario Principal */}
      <section className="reservas-form-section">
        <div className="section-container">
          <div className="reservas-layout">
            {/* Columna del Formulario */}
            <div className="form-column">
              <div className="form-wrapper">
                <header className="form-header">
                  <h2 className="form-title">Completa tu Reserva</h2>
                  <p className="form-subtitle">Todos los campos son requeridos</p>
                </header>
                <ReservaForm />
              </div>
            </div>

            {/* Columna de Información */}
            <div className="info-column">
              {/* Políticas */}
              <div className="info-card">
                <h3 className="info-card-title">
                  <span className="material-symbols-outlined">info</span>
                  Información Importante
                </h3>
                <ul className="info-list">
                  <li>
                    <span className="material-symbols-outlined">schedule</span>
                    Reservas con mínimo 4 horas de anticipación
                  </li>
                  <li>
                    <span className="material-symbols-outlined">calendar_month</span>
                    Fines de semana: 24 horas de anticipación
                  </li>
                  <li>
                    <span className="material-symbols-outlined">timer</span>
                    Tiempo máximo de reserva: 2 horas
                  </li>
                  <li>
                    <span className="material-symbols-outlined">notification_important</span>
                    Llega máximo 15 minutos tarde
                  </li>
                </ul>
              </div>

              {/* Horarios */}
              <div className="info-card">
                <h3 className="info-card-title">
                  <span className="material-symbols-outlined">schedule</span>
                  Horarios de Reserva
                </h3>
                <div className="hours-block">
                  <div className="hours-row">
                    <span className="hours-day">Lun - Jue</span>
                    <span className="hours-time">11:30 AM - 9:00 PM</span>
                  </div>
                  <div className="hours-row">
                    <span className="hours-day">Vie - Sáb</span>
                    <span className="hours-time">12:00 PM - 9:30 PM</span>
                  </div>
                  <div className="hours-row">
                    <span className="hours-day">Domingo</span>
                    <span className="hours-time">12:00 PM - 8:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="info-card highlight">
                <h3 className="info-card-title">
                  <span className="material-symbols-outlined">phone</span>
                  ¿Necesitas Ayuda?
                </h3>
                <p className="contact-text">Para grupos grandes o eventos especiales:</p>
                <a href="tel:099-123-4567" className="contact-phone">
                  099-123-4567
                </a>
                <p className="contact-email">reservas@chuguegrill.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ocasiones Especiales */}
      <section className="reservas-occasions">
        <div className="section-container">
          <div className="section-header">
            <p className="section-tagline">Celebra con Nosotros</p>
            <h2 className="section-title">Ocasiones Especiales</h2>
            <div className="section-divider"></div>
          </div>

          <div className="occasions-grid">
            <div className="occasion-card">
              <div className="occasion-icon">
                <span className="material-symbols-outlined">cake</span>
              </div>
              <h3 className="occasion-title">Cumpleaños</h3>
              <p className="occasion-text">
                Decoración especial, globos y postre de cortesía para el cumpleañero
              </p>
            </div>
            <div className="occasion-card">
              <div className="occasion-icon">
                <span className="material-symbols-outlined">favorite</span>
              </div>
              <h3 className="occasion-title">Aniversarios</h3>
              <p className="occasion-text">
                Mesa decorada con velas y pétalos para una noche romántica
              </p>
            </div>
            <div className="occasion-card">
              <div className="occasion-icon">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <h3 className="occasion-title">Eventos Corporativos</h3>
              <p className="occasion-text">
                Espacios privados para reuniones de negocios y celebraciones
              </p>
            </div>
          </div>
        </div>
      </section>

      <PiePagina />
    </div>
  );
}

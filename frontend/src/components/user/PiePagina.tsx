import { Link } from "react-router-dom";
import "../../css/user/PiePagina.css";

export default function PiePagina() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-premium">
      {/* Línea decorativa superior */}
      <div className="footer-accent-line"></div>

      <div className="footer-container">
        {/* Columna Principal - Logo y descripción */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-text">Chuwue</span>
            <span className="footer-logo-accent">Grill</span>
          </Link>
          <p className="footer-tagline">
            Steakhouse Premium
          </p>
          <p className="footer-description">
            Las mejores alitas y parrilladas de la ciudad. Una experiencia 
            gastronómica donde cada plato cuenta una historia de sabor auténtico.
          </p>
        </div>

        {/* Navegación */}
        <div className="footer-section">
          <h4 className="footer-section-title">Navegar</h4>
          <nav className="footer-nav">
            <Link to="/" className="footer-link">Inicio</Link>
            <Link to="/menu" className="footer-link">Menú</Link>
            <Link to="/reservas" className="footer-link">Reservas</Link>
            <Link to="/filavirtual" className="footer-link">Fila Virtual</Link>
          </nav>
        </div>

        {/* Contacto */}
        <div className="footer-section">
          <h4 className="footer-section-title">Contacto</h4>
          <div className="footer-contact">
            <a href="tel:099-123-4567" className="footer-contact-item">
              <span className="material-symbols-outlined">phone</span>
              <span>099-123-4567</span>
            </a>
            <a href="mailto:info@chuguegrill.com" className="footer-contact-item">
              <span className="material-symbols-outlined">mail</span>
              <span>info@chuguegrill.com</span>
            </a>
            <div className="footer-contact-item">
              <span className="material-symbols-outlined">location_on</span>
              <span>Av. Principal 123, Montevideo</span>
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="footer-section">
          <h4 className="footer-section-title">Horarios</h4>
          <div className="footer-hours">
            <div className="hours-row">
              <span className="hours-days">Lun - Jue</span>
              <span className="hours-time">11:00 AM - 10:00 PM</span>
            </div>
            <div className="hours-row">
              <span className="hours-days">Vie - Sáb</span>
              <span className="hours-time">11:00 AM - 11:00 PM</span>
            </div>
            <div className="hours-row">
              <span className="hours-days">Domingo</span>
              <span className="hours-time">12:00 PM - 9:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          {/* Redes Sociales */}
          <div className="footer-social">
            <a 
              href="https://facebook.com/chuguegrill" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-link"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://instagram.com/chuguegrill" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-link"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com/chuguegrill" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-link"
              aria-label="Twitter/X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.1-6.72-5.85 6.72h-3.306l7.73-8.835L.26 2.25h6.734l4.888 6.48L17.04 2.25h.204zm-1.161 17.52h1.833L7.084 4.126H5.117l12.926 15.644z"/>
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <p className="footer-copyright">
            © {currentYear} Chuwue Grill. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

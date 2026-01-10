import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../css/user/Navbar.css";

const elementosNavegacion = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Menú", ruta: "/menu" },
  { nombre: "Reservas", ruta: "/reservas" },
  { nombre: "Fila Virtual", ruta: "/filavirtual" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (ruta: string) => location.pathname === ruta;

  return (
    <nav className={`navbar-premium ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Chuwue</span>
          <span className="logo-accent">Grill</span>
        </Link>

        {/* Navegación Desktop */}
        <div className="navbar-links">
          {elementosNavegacion.map((elemento) => (
            <Link
              key={elemento.ruta}
              to={elemento.ruta}
              className={`navbar-link ${isActive(elemento.ruta) ? "active" : ""}`}
            >
              {elemento.nombre}
              <span className="link-underline"></span>
            </Link>
          ))}
        </div>

        {/* Botón Reservar */}
        <Link to="/reservas" className="navbar-cta">
          Reservar Mesa
        </Link>

        {/* Botón Hamburguesa Mobile */}
        <button
          className={`navbar-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú de navegación"
          aria-expanded={menuOpen}
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>
      </div>

      {/* Menú Mobile */}
      <div className={`navbar-mobile ${menuOpen ? "open" : ""}`}>
        <div className="mobile-links">
          {elementosNavegacion.map((elemento) => (
            <Link
              key={elemento.ruta}
              to={elemento.ruta}
              className={`mobile-link ${isActive(elemento.ruta) ? "active" : ""}`}
            >
              {elemento.nombre}
            </Link>
          ))}
          <Link to="/reservas" className="mobile-cta">
            Reservar Mesa
          </Link>
        </div>
      </div>

      {/* Overlay para cerrar menú mobile */}
      {menuOpen && (
        <div 
          className="navbar-overlay" 
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}

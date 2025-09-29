import { Link } from "react-router-dom";
import "../../css/user/Navbar.css";

const elementosNavegacion = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Menú", ruta: "/menu" },
  { nombre: "Reservas", ruta: "/reservas" },
  { nombre: "Fila Virtual", ruta: "/filavirtual" },
];

export default function Navbar() {
  return (
    <nav className="barra-navegacion">
      <div className="contenedor-navegacion">
        {/* Logo del restaurante */}
        <div className="logo-restaurante">
          <Link to="/" className="enlace-logo">
            <h2 className="nombre-restaurante">Chuwue Grill</h2>
          </Link>
        </div>

        {/* Menú de navegación */}
        <div className="menu-navegacion">
          {elementosNavegacion.map((elemento) => (
            <Link 
              key={elemento.ruta} 
              to={elemento.ruta} 
              className="enlace-navegacion"
            >
              {elemento.nombre}
            </Link>
          ))}
        </div>

        {/* Botón de contacto */}
        {/*<div className="seccion-contacto-nav">
          <a href="tel:099-123-4567" className="boton-contacto">
            📞 Llamar
          </a>
        </div>*/}
      </div>
    </nav>
  );
}

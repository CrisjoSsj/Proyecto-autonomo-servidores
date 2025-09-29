import { Link } from "react-router-dom";
import "../../css/admin/NavbarAdmin.css";

const elementosNavegacionAdmin = [
  { nombre: "Dashboard", ruta: "/admin" },
  { nombre: "Mesas", ruta: "/admin/mesas" },
  { nombre: "Reservas", ruta: "/admin/reservas" },
  { nombre: "Menú", ruta: "/admin/menu" },
  { nombre: "Reportes", ruta: "/admin/reportes" },
];

export default function NavbarAdmin() {
  return (
    <nav className="barra-navegacion-admin">
      <div className="contenedor-navegacion-admin">
        {/* Logo y título del admin */}
        <div className="logo-admin">
          <Link to="/admin" className="enlace-logo-admin">
            <h2 className="titulo-admin">Chuwue Grill Admin</h2>
          </Link>
        </div>

        {/* Menú de navegación admin */}
        <div className="menu-navegacion-admin">
          {elementosNavegacionAdmin.map((elemento) => (
            <Link 
              key={elemento.ruta} 
              to={elemento.ruta} 
              className="enlace-navegacion-admin"
            >
              {elemento.nombre}
            </Link>
          ))}
        </div>

        {/* Información del admin y acciones */}
        <div className="seccion-admin-info">
          <div className="info-sesion">
            <span className="nombre-admin">Admin</span>
            <span className="rol-admin">Administrador</span>
          </div>
          <div className="botones-admin">
            <button className="boton-notificaciones">
              🔔 <span className="contador-notificaciones">3</span>
            </button>
            <Link to="/" className="boton-ver-sitio">
              👁️ Ver Sitio
            </Link>
            <button className="boton-logout">
              🚪 Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService, User } from "../../services/AuthService";
import "../../css/admin/NavbarAdmin.css";

const elementosNavegacionAdmin = [
  { nombre: "Dashboard", ruta: "/admin" },
  { nombre: "Mesas", ruta: "/admin/mesas" },
  { nombre: "Reservas", ruta: "/admin/reservas" },
  { nombre: "Menú", ruta: "/admin/menu" },
  { nombre: "Reportes", ruta: "/admin/reportes" },
];

export default function NavbarAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

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
            <span className="nombre-admin">{user?.name || 'Admin'}</span>
            <span className="rol-admin">{user?.email || 'Administrador'}</span>
          </div>
          <div className="botones-admin">
            <button className="boton-notificaciones" title="Notificaciones">
              <span className="material-symbols-outlined">notifications</span>
              <span className="contador-notificaciones">3</span>
            </button>
            <Link to="/" className="boton-ver-sitio" title="Ver sitio">
              <span className="material-symbols-outlined">visibility</span>
              Ver Sitio
            </Link>
            <button 
              className="boton-logout" 
              title="Cerrar sesión"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined">logout</span>
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
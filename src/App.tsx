import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Páginas de usuario
import Home from "./pages/user/Home";
import Menu from "./pages/user/Menu";
import Reservas from "./pages/user/Reservas";
import FilaVirtual from "./pages/user/FilaVirtual";
// Páginas de administración
import Dashboard from "./pages/admin/Dashboard";
import GestionMesas from "./pages/admin/GestionMesas";
import GestionReservas from "./pages/admin/GestionReservas";
import GestionMenu from "./pages/admin/GestionMenu";
import Reportes from "./pages/admin/Reportes";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas de usuario */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/filavirtual" element={<FilaVirtual />} />
        
        {/* Rutas de administración */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/mesas" element={<GestionMesas />} />
        <Route path="/admin/reservas" element={<GestionReservas />} />
        <Route path="/admin/menu" element={<GestionMenu />} />
        <Route path="/admin/reportes" element={<Reportes />} />
      </Routes>
    </Router>
  );
}

export default App;

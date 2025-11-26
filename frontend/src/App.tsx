import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Páginas de usuario
import Home from "./pages/user/Home";
import Menu from "./pages/user/Menu";
import Reservas from "./pages/user/Reservas";
import FilaVirtual from "./pages/user/FilaVirtual";
// Páginas de administración
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import GestionMesas from "./pages/admin/GestionMesas";
import GestionReservas from "./pages/admin/GestionReservas";
import GestionMenu from "./pages/admin/GestionMenu";
import Reportes from "./pages/admin/Reportes";
// Componentes
import ProtectedRoute from "./components/admin/ProtectedRoute";


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
        <Route path="/admin/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/mesas" 
          element={
            <ProtectedRoute>
              <GestionMesas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reservas" 
          element={
            <ProtectedRoute>
              <GestionReservas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/menu" 
          element={
            <ProtectedRoute>
              <GestionMenu />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reportes" 
          element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/inventario" 
          element={
            <ProtectedRoute>
              <GestionMenu />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirigir /admin a /admin/login si no está autenticado */}
        <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

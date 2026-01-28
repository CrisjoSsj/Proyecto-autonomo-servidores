import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Páginas de usuario
import Home from "./pages/user/Home";
import Menu from "./pages/user/Menu";
import Reservas from "./pages/user/Reservas";
import FilaVirtual from "./pages/user/FilaVirtual";
import Pagos from "./pages/user/Pagos";
// Páginas de administración
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import GestionMesas from "./pages/admin/GestionMesas";
import GestionReservas from "./pages/admin/GestionReservas";
import GestionMenu from "./pages/admin/GestionMenu";
import Reportes from "./pages/admin/Reportes";
// Nuevas páginas del Segundo Parcial
import AdminChat from "./pages/admin/Chat";
import AdminPagos from "./pages/admin/Pagos";
import AdminPartners from "./pages/admin/Partners";
// Componentes
import ProtectedRoute from "./components/admin/ProtectedRoute";
import ChatBot from "./components/ChatBot";


function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas de usuario */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/filavirtual" element={<FilaVirtual />} />
        <Route path="/pagos" element={<Pagos />} />
        
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
        
        {/* Nuevas rutas del Segundo Parcial */}
        <Route 
          path="/admin/chat" 
          element={
            <ProtectedRoute>
              <AdminChat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/pagos" 
          element={
            <ProtectedRoute>
              <AdminPagos />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/partners" 
          element={
            <ProtectedRoute>
              <AdminPartners />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirigir /admin a /admin/login si no está autenticado */}
        <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
      
      {/* ChatBot flotante - visible en todas las páginas */}
      <ChatBot apiUrl="http://localhost:8003" />
    </Router>
  );
}

export default App;

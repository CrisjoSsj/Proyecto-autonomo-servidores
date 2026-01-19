import './App.css'
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/homePage';
import { LoginPage } from './pages/loginPage';
import { RegisterPage } from './pages/registerPage';
import { ProfilePage } from './pages/profilePage';
import NuevoServicio from './pages/Proveedor/NuevoServicio';
import { ReservaPage } from './pages/Cliente/reservaPage';
import { ReservasCliente } from './pages/Cliente/ReservasCliente';
import Pago from './pages/Cliente/pago';
import PagoCheckout from './pages/Cliente/PagoCheckout';
import { Fotos } from './pages/Proveedor/foto';
import { ServiciosProveedor } from './pages/Proveedor/MisServicios';
import { ServiciosCliente } from './pages/Cliente/TodosServicios';
import { ServicioDetalles } from './pages/Cliente/DetallesServicio';
import { ComentariosServicio } from './pages/Cliente/Comentario';
import { Calificaciones } from './pages/Cliente/Calificaciones';
import { Ubicaciones } from './pages/Proveedor/Ubicaciones';
import { ReservaServicio } from './pages/Cliente/ReservaServicio';
import { ServicioReservaList } from './pages/Cliente/ServicioReservaList';
import { CategoriasCliente } from './pages/Cliente/Categorias';
import Dashboard from './pages/Dashboard';
import DashboardProveedor from './pages/Proveedor/DashboardProveedor';
import { Footer } from './components/Footer';
import DashboardCliente from './pages/Cliente/DashboardCliente';
import { AdminDashboard } from './pages/AdminDashboard';
import BusinessDashboard from './pages/BusinessDashboard';
import AiChat from './pages/AiChat';

function App() {

  return (
    <div>
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="/mis-servicios" element={<ServiciosProveedor />} />
          <Route path="/todos-servicios" element={<ServiciosCliente />} />
          <Route path="/crear-nuevo-servicio" element={<NuevoServicio />} />
          <Route path="/crear-nuevo-servicio/:id" element={<NuevoServicio />} />
          <Route path="/todos-servicios/:id" element={<ServicioDetalles />} />
          <Route path="/todos-servicios/:servicio_id/comentarios" element={<ComentariosServicio />} />
          <Route path="/crear-nuevo-servicio/agregar-fotos/:servicio_id" element={<Fotos />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/crear-nuevo-servicio/ubicaciones/:servicio_id" element={<Ubicaciones />} />
          <Route path="/servicios/reserva/form" element={<ReservaPage />} />
          <Route path="/servicios/reserva-list/" element={<ReservasCliente />} />
          <Route path="/servicios/reserva-list/reservados/:reserva_id" element={<ServicioReservaList />} />
          <Route path="/servicios/reserva-list/reserva/pago/:id" element={<Pago />} />
          <Route path="/pago/:id" element={<PagoCheckout />} />
          <Route path='/todos-servicios/:servicio_id/calificaciones' element={<Calificaciones />} />
          <Route path='/todos-servicios/:servicio_id/reservaServicio' element={<ReservaServicio />} />
          <Route path='/servicios/reserva-list/reservados/:reserva_id/:id' element={<ReservaServicio />} />
          <Route path="/categorias" element={<CategoriasCliente />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/proveedor/dashboard" element={<DashboardProveedor />} />
          <Route path="/cliente/dashboard" element={<DashboardCliente />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/negocio/dashboard" element={<BusinessDashboard />} />
          <Route path="/ai-chat" element={<AiChat />} />

        </Routes>
        <Footer />
        
    </div>
  )
}

export default App

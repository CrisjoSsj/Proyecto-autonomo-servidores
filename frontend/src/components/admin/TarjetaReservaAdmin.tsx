import { memo } from 'react';

interface Reserva {
  id_reserva?: number;
  id?: number;
  id_cliente?: number;
  id_mesa: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  numero_personas?: number;
  ocasion_especial?: string;
  comentarios?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
}

interface TarjetaReservaAdminProps {
  reserva: Reserva;
  onConfirmar: (id: number) => void;
  onRechazar: (id: number) => void;
  onEditar: (id: number) => void;
}

const TarjetaReservaAdmin = memo(function TarjetaReservaAdmin({
  reserva,
  onConfirmar,
  onRechazar,
  onEditar
}: TarjetaReservaAdminProps) {
  const reservaId = reserva.id || reserva.id_reserva || 0;
  const isConfirmedOrRejected = reserva.estado === 'confirmada' || reserva.estado === 'rechazada';

  return (
    <div className={`tarjeta-reserva-admin ${reserva.estado || 'pendiente'}`}>
      <div className="header-reserva-admin">
        <div className="info-basica-reserva">
          <span className="hora-reserva">{reserva.hora_inicio}</span>
          <span className="nombre-cliente-reserva">{reserva.nombre || 'Cliente'}</span>
          <span className="personas-reserva">{reserva.numero_personas || '-'} personas</span>
          <span className="mesa-asignada">Mesa {reserva.id_mesa}</span>
        </div>
        <div className="estado-reserva">
          <span className={`badge-estado ${reserva.estado || 'pendiente'}`}>
            {(reserva.estado || 'pendiente').toUpperCase()}
          </span>
        </div>
      </div>
      <div className="detalles-reserva">
        <p className="telefono-reserva">📞 {reserva.telefono || 'N/A'}</p>
        <p className="email-reserva">📧 {reserva.email || 'N/A'}</p>
        {reserva.ocasion_especial && <p className="ocasion-reserva">🎉 {reserva.ocasion_especial}</p>}
        {reserva.comentarios && <p className="comentarios-reserva">{reserva.comentarios}</p>}
        <p className="fecha-reserva">📅 {reserva.fecha}</p>
      </div>
      <div className="acciones-reserva-admin">
        <button 
          className="boton-confirmar-reserva" 
          onClick={() => onConfirmar(reservaId)}
          disabled={isConfirmedOrRejected}
        >
          ✓ Confirmar
        </button>
        <button 
          className="boton-rechazar-reserva" 
          onClick={() => onRechazar(reservaId)}
          disabled={isConfirmedOrRejected}
        >
          ✕ Rechazar
        </button>
        <button 
          className="boton-editar-reserva" 
          onClick={() => onEditar(reservaId)}
        >
          ✎ Editar
        </button>
      </div>
    </div>
  );
});

export default TarjetaReservaAdmin;

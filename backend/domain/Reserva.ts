import type { ICliente } from './Cliente';
import type { IMesa } from './Mesa';

export interface IReserva {
  id_reserva: number;
  id_cliente: number;
  id_mesa: number;
  fecha: Date;
  hora_inicio: Date;
  hora_fin: Date;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'finalizada';
  cliente?: ICliente;
  mesa?: IMesa;
}
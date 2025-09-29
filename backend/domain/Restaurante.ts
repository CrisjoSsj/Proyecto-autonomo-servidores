import type { IMesa } from './Mesa';
import type { IReserva } from './Reserva';
import type { IMenu } from './Menu';

export interface IRestaurante {
  id_restaurante: number;
  nombre: string;
  direccion: string;
  telefono: string;
  mesas: IMesa[];
  reservas: IReserva[];
  menu: IMenu;
}
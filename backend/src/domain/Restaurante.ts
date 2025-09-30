import { IMesa } from './Mesa';
import { IReserva } from './Reserva';
import { IMenu } from './Menu';
export interface IRestaurante {
  id_restaurante: number;
  nombre: string;
  direccion: string;
  telefono: string;
  mesas: IMesa[];
  reservas: IReserva[];
  menu: IMenu;
}
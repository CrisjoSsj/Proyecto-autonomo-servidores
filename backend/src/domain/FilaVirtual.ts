import { ICliente } from "./Cliente";
export interface IFilaVirtual {
  id_fila: number;
  id_cliente: number;
  posicion: number; 
  estado: 'esperando' | 'notificado' | 'asignado' | 'cancelado';
  cliente?: ICliente;
}
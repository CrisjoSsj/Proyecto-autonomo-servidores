import { ICliente } from "./Cliente";
export interface IFilaVirtual {
  id_fila: number;
  id_cliente: number;
  fecha_hora_ingreso: Date;
  estado: 'esperando' | 'notificado' | 'asignado' | 'cancelado';
  cliente?: ICliente;
}

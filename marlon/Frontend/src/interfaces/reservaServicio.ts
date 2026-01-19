import type { Ireserva } from "./reserva";
import type { Iservicio } from "./servicio";

export interface IreservaServicio{
    id?: number;
    reserva?: Ireserva;
    reserva_id?: number;
    servicio?: Iservicio;
    servicio_id?: number;
    fecha_servicio: string;
    hora_servicio: string;
    estado?: 'pendiente' | 'confirmada' | 'rechazada';
}
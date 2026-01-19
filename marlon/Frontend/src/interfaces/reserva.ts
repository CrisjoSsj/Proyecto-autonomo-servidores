import type { Icliente } from "./cliente";
import type { IreservaServicio } from "./reservaServicio";

export interface Ireserva{
    id?: number;
    cliente?: Icliente;
    cliente_id?: number;
    fecha: string;
    hora: string;
    estado?: "pendiente"| "confirmada" | "cancelada";
    total_estimado: number;
    detalles?: IreservaServicio[];
    servicio?: any;
}
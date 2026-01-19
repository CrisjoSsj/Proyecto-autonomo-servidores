import type { Ireserva } from "./reserva";

export interface Ipago{
    id?: number;
    reserva_id: Ireserva | number;
    metodo_pago?: "efectivo" | "tarjeta" | "transferencia";
    monto: number;
    estado?: "pendiente" | "pagado" | "rechazado";
    referencia?: string | null;
    fecha_pago: string | null;
}
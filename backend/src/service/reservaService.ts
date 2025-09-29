import { IReserva } from "../dominio/Reserva";

export class ReservaService {
    private reservas: IReserva[] = [];
    private nextId: number = 1;
    agregarReserva(reserva: Omit<IReserva, 'id_reserva'>): IReserva {
        const nuevaReserva: IReserva = { id_reserva: this.nextId++, ...reserva };
        this.reservas.push(nuevaReserva);
        return nuevaReserva;
    }
    obtenerReservas(): IReserva[] {
        return this.reservas;
    }
    buscarReservaPorId(id: number): IReserva | undefined {
        return this.reservas.find(reserva => reserva.id_reserva === id);
    }
    eliminarReserva(id: number): void {
        this.reservas = this.reservas.filter(reserva => reserva.id_reserva !== id);
    }
    actualizarReserva(id: number, datosActualizados: Partial<IReserva>): void {
        const reserva = this.buscarReservaPorId(id);
        if (reserva) {
            Object.assign(reserva, datosActualizados);
        }
    }
}
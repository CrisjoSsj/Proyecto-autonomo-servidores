import { IFilaVirtual } from "../domain/FilaVirtual";

export class FilaService {
    private filas: IFilaVirtual[] = [];
    private nextId: number = 1; 

    agregarFila(fila: Omit<IFilaVirtual, 'id_fila' | 'posicion'>): IFilaVirtual {
        const nuevaFila: IFilaVirtual = { id_fila: this.nextId++, posicion: this.filas.length + 1, ...fila };
        this.filas.push(nuevaFila);
        return nuevaFila;
    }

    obtenerFilas(): IFilaVirtual[] {
        return this.filas;
    }   

    buscarFilaPorId(id: number): IFilaVirtual | undefined {
        return this.filas.find(fila => fila.id_fila === id);
    }

    eliminarFila(id: number): void {
        this.filas = this.filas.filter(fila => fila.id_fila !== id);
        this.actualizarPosiciones();
    }

    actualizarFila(id: number, datosActualizados: Partial<IFilaVirtual>): void {
        const fila = this.buscarFilaPorId(id);
        if (fila) {
            Object.assign(fila, datosActualizados);
        }
    }

    private actualizarPosiciones(): void {
        this.filas.forEach((fila, index) => {
            fila.posicion = index + 1;
        });
    }
    notificarSiguienteCliente(): IFilaVirtual | undefined {
        const siguienteFila = this.filas.find(fila => fila.estado === 'esperando');
        if (siguienteFila) {
            siguienteFila.estado = 'notificado';
        }
        return siguienteFila;
    }   
    asignarMesaACliente(id_fila: number): boolean {
        const fila = this.buscarFilaPorId(id_fila);
        if (fila && fila.estado === 'notificado') {
            fila.estado = 'asignado';
            return true;
        }
        return false;
    }
    cancelarFila(id_fila: number): boolean {
        const fila = this.buscarFilaPorId(id_fila);
        if (fila && (fila.estado === 'esperando' || fila.estado === 'notificado')) {
            fila.estado = 'cancelado';
            this.actualizarPosiciones();
            return true;
        }
        return false;
    }
    obtenerFilasPorEstado(estado: IFilaVirtual['estado']): IFilaVirtual[] {
        return this.filas.filter(fila => fila.estado === estado);
    }   
    obtenerPosicionEnFila(id_fila: number): number | undefined {
        const fila = this.buscarFilaPorId(id_fila);
        return fila ? fila.posicion : undefined;
    }
    obtenerTiempoEstimadoEspera(id_fila: number, tiempoPromedioAtencion: number): number | undefined {
        const fila = this.buscarFilaPorId(id_fila); 
        if (fila && fila.estado === 'esperando') {
            const clientesAdelante = this.filas.filter(f => f.estado === 'esperando' && f.posicion < fila.posicion).length;
            return clientesAdelante * tiempoPromedioAtencion;
        }
        return undefined;
    }
    limpiarFilasCanceladasOAsignadas(): void {
        this.filas = this.filas.filter(fila => fila.estado === 'esperando' || fila.estado === 'notificado');
        this.actualizarPosiciones();
    }
    obtenerFilaPorCliente(id_cliente: number): IFilaVirtual | undefined {
        return this.filas.find(fila => fila.id_cliente === id_cliente && (fila.estado === 'esperando' || fila.estado === 'notificado'));
    }   
    reiniciarFila(): void {
        this.filas = [];
        this.nextId = 1;
    }
    obtenerTotalFilas(): number {
        return this.filas.length;
    }
    obtenerTotalFilasPorEstado(estado: IFilaVirtual['estado']): number {
        return this.filas.filter(fila => fila.estado === estado).length;
    }
}
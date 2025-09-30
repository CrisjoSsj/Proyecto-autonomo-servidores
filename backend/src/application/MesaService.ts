import { IMesa } from "../domain/Mesa";

export class MesaService {
    private mesas: IMesa[] = [];
    private nextId: number = 1;

    agregarMesa(mesa: Omit<IMesa, 'id_mesa'>): IMesa {
        const nuevaMesa: IMesa = { id_mesa: this.nextId++, ...mesa };
        this.mesas.push(nuevaMesa);
        return nuevaMesa;
    }
    obtenerMesas(): IMesa[] {
        return this.mesas;
    }
    buscarMesaPorId(id: number): IMesa | undefined {
        return this.mesas.find(mesa => mesa.id_mesa === id);
    }
    eliminarMesa(id: number): void {
        this.mesas = this.mesas.filter(mesa => mesa.id_mesa !== id);
    }
    actualizarMesa(id: number, datosActualizados: Partial<IMesa>): void {
        const mesa = this.buscarMesaPorId(id);
        if (mesa) {
            Object.assign(mesa, datosActualizados);
        }
    }
}
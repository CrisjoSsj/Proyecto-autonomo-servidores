import { IPlato } from "../domain/Plato";

export class PlatoService {
    private platos: IPlato[] = [];

    agregarPlato(plato: IPlato): void {
        this.platos.push(plato);
    }
    obtenerPlatos(): IPlato[] {
        return this.platos;
    }
    buscarPlatoPorId(id: number): IPlato | undefined {
        return this.platos.find(plato => plato.id_plato === id);
    }
    eliminarPlato(id: number): void {
        this.platos = this.platos.filter(plato => plato.id_plato !== id);
    }
    actualizarPlato(id: number, datosActualizados: Partial<IPlato>): void {
        const plato = this.buscarPlatoPorId(id);
        if (plato) {
            Object.assign(plato, datosActualizados);
        }
    }
}
import { IRestaurante } from "../dominio/Restaurante";

export class RestauranteService {
    private restaurantes: IRestaurante[] = [];
    private nextId: number = 1;

    crear(restaurante: Omit<IRestaurante, 'id_restaurante'>): IRestaurante {
        const nuevoRestaurante: IRestaurante = { id_restaurante: this.nextId++, ...restaurante };
        this.restaurantes.push(nuevoRestaurante);
        return nuevoRestaurante;
    }

    actualizar(id: number, datosActualizados: Partial<IRestaurante>): IRestaurante | undefined {
        const restaurante = this.obtenerPorId(id);
        if (restaurante) {
            Object.assign(restaurante, datosActualizados);
            return restaurante;
        }
        return undefined;
    }
    obtenerPorId(id: number): IRestaurante | undefined {
        return this.restaurantes.find(r => r.id_restaurante === id);
    }   
}
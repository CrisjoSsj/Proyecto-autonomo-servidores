import type { ICliente } from '../domain/Cliente';
const clientes: ICliente[] = [];

export class ClienteService {
    constructor() {

    }
    crear (cliente: ICliente): void {
        clientes.push(cliente);
    }
    modificar (cliente: ICliente): void {
        const index = clientes.findIndex(c => c.id_cliente === cliente.id_cliente);
        if (index !== -1) {
            clientes[index] = cliente;
        }
    }
    eliminar (id: number): void {
        const index = clientes.findIndex(c => c.id_cliente === id);
        if (index !== -1) {
            clientes.splice(index, 1);
        }
    }
    actualizar (cliente: ICliente): void {
        const index = clientes.findIndex(c => c.id_cliente === cliente.id_cliente);
        if (index !== -1) {
            clientes[index] = cliente;
        }
        
    }
    mostrar (): ICliente[] {
        return clientes;
    }
}


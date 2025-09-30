import { ICliente } from "../domain/Cliente";
import { clientes } from "../infrastructure/ClienteRepository";


export class ClienteService {
    private clientes: ICliente[] = [];

    agregarCliente(cliente: ICliente): void {
        this.clientes.push(cliente);
    }
    obtenerClientes(): ICliente[] {
        return this.clientes;
    }
    buscarClientePorId(id: number): ICliente | undefined {
        return this.clientes.find(cliente => cliente.id_cliente === id);
    }
    eliminarCliente(id: number): void {
        this.clientes = this.clientes.filter(cliente => cliente.id_cliente !== id);
    }
    actualizarCliente(id: number, datosActualizados: Partial<ICliente>): void {
        const cliente = this.buscarClientePorId(id);
        if (cliente) {
            Object.assign(cliente, datosActualizados);
        }
    }
}
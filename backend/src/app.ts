import { ClienteService } from "./service/clineteService";

const clienteService = new ClienteService();

clienteService.agregarCliente({
    id_cliente: 1,
    nombre: "Juan",
    correo: "Perez@gmail.co",
    telefono: "123456789"
});
clienteService.obtenerClientes().forEach((cliente) => {
    console.log(`ID: ${cliente.id_cliente}, Nombre: ${cliente.nombre}, Correo: ${cliente.correo}, Teléfono: ${cliente.telefono}`);
}
);

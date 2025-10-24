require_relative './app/models/cliente'
require_relative './app/models/mesa'
require_relative './app/models/reserva'

cliente = Cliente.new(id_cliente: 1, nombre: "Joustin", correo: "j@demo.com", telefono: "12345")
mesa = Mesa.new(id_mesa: 10, numero: "A1", capacidad: 4, estado: "disponible")
reserva = Reserva.new(
  id_reserva: 101,
  id_cliente: 1,
  id_mesa: 10,
  fecha: "2025-10-20",
  hora_inicio: "12:00",
  hora_fin: "13:00",
  estado: "pendiente",
  cliente: cliente,
  mesa: mesa
)

puts "Reserva creada:"
puts "Cliente: #{reserva.cliente.nombre}"
puts "Mesa: #{reserva.mesa.numero}"
puts "Estado: #{reserva.estado}"

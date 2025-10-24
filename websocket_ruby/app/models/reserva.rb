# app/models/reserva.rb
require_relative './cliente'
require_relative './mesa'

class Reserva
  attr_accessor :id_reserva, :id_cliente, :id_mesa, :fecha, :hora_inicio, :hora_fin, :estado, :cliente, :mesa

  def initialize(id_reserva:, id_cliente:, id_mesa:, fecha:, hora_inicio:, hora_fin:, estado:, cliente: nil, mesa: nil)
    @id_reserva = id_reserva
    @id_cliente = id_cliente
    @id_mesa = id_mesa
    @fecha = fecha
    @hora_inicio = hora_inicio
    @hora_fin = hora_fin
    @estado = estado
    @cliente = cliente
    @mesa = mesa
  end
end

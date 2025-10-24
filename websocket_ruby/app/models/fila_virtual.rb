# app/models/fila_virtual.rb
require_relative './cliente'

class FilaVirtual
  attr_accessor :id_fila, :id_cliente, :fecha_hora_ingreso, :estado, :cliente

  def initialize(id_fila:, id_cliente:, fecha_hora_ingreso:, estado:, cliente: nil)
    @id_fila = id_fila
    @id_cliente = id_cliente
    @fecha_hora_ingreso = fecha_hora_ingreso
    @estado = estado
    @cliente = cliente
  end
end

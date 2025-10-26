# app/models/mesa.rb
class Mesa
  attr_accessor :id_mesa, :numero, :capacidad, :estado

  def initialize(id_mesa:, numero:, capacidad:, estado:)
    @id_mesa = id_mesa
    @numero = numero
    @capacidad = capacidad
    @estado = estado
  end
end

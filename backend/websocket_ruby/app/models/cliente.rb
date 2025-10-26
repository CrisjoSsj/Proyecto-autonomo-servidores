# app/models/cliente.rb
class Cliente
  attr_accessor :id_cliente, :nombre, :correo, :telefono

  def initialize(id_cliente:, nombre:, correo:, telefono:)
    @id_cliente = id_cliente
    @nombre = nombre
    @correo = correo
    @telefono = telefono
  end
end

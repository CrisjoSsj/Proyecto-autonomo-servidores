# app/models/restaurante.rb
require_relative './mesa'
require_relative './reserva'
require_relative './menu'

class Restaurante
  attr_accessor :id_restaurante, :nombre, :direccion, :telefono, :mesas, :reservas, :menu

  def initialize(id_restaurante:, nombre:, direccion:, telefono:, mesas: [], reservas: [], menu: nil)
    @id_restaurante = id_restaurante
    @nombre = nombre
    @direccion = direccion
    @telefono = telefono
    @mesas = mesas
    @reservas = reservas
    @menu = menu
  end
end

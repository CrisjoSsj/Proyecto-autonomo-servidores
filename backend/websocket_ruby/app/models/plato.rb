# app/models/plato.rb
require_relative './categoria_menu'

class Plato
  attr_accessor :id_plato, :nombre, :descripcion, :precio, :disponible, :categoria

  def initialize(id_plato:, nombre:, descripcion:, precio:, disponible:, categoria: nil)
    @id_plato = id_plato
    @nombre = nombre
    @descripcion = descripcion
    @precio = precio
    @disponible = disponible
    @categoria = categoria
  end
end

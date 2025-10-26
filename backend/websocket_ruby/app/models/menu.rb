# app/models/menu.rb
require_relative './plato'

class Menu
  attr_accessor :id_menu, :fecha, :platos

  def initialize(id_menu:, fecha:, platos: [])
    @id_menu = id_menu
    @fecha = fecha
    @platos = platos
  end
end

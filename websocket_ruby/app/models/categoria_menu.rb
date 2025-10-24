# app/models/categoria_menu.rb
class CategoriaMenu
  attr_accessor :id_categoria, :nombre

  def initialize(id_categoria:, nombre:)
    @id_categoria = id_categoria
    @nombre = nombre
  end
end

# app/models/utils/data_store.rb
class DataStore
  @clientes = []
  @filas = []
  @mesas = []
  @reservas = []

  class << self
    attr_accessor :clientes, :filas, :mesas, :reservas

    # Buscar cliente por ID
    def find_cliente(id)
      @clientes.find { |c| c.id_cliente == id }
    end

    # Añadir cliente si no existe
    def add_cliente(cliente)
      @clientes << cliente unless find_cliente(cliente.id_cliente)
    end

    # Añadir fila virtual
    def add_fila(fila)
      @filas << fila
    end

    def remove_fila(id_cliente)
      @filas.reject! { |f| f.id_cliente == id_cliente }
    end
  end
end

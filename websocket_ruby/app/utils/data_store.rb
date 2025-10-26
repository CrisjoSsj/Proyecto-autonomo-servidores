# app/models/utils/data_store.rb
require_relative '../models/cliente'
require_relative '../models/fila_virtual'
require_relative '../models/mesa'
require 'monitor'

class DataStore
  extend MonitorMixin
  @clientes = [
    cliente = Cliente.new(id_cliente: 1, nombre: 'Juan Perez', correo: 'juan.perez@example.com', telefono: '123456789'),
    cliente = Cliente.new(id_cliente: 2, nombre: 'Maria Gomez', correo: 'maria.gomez@example.com', telefono: '987654321'),
  ]
  @filas = [
    fila = FilaVirtual.new(id_fila: 1, id_cliente: 1, fecha_hora_ingreso: Time.now, estado: 'esperando'),
    fila = FilaVirtual.new(id_fila: 2, id_cliente: 2, fecha_hora_ingreso: Time.now, estado: 'esperando'),
  ]
  @mesas = [
    mesa = Mesa.new(id_mesa: 1, numero: 1, capacidad: 4, estado: 'libre'),
    mesa = Mesa.new(id_mesa: 2, numero: 2, capacidad: 2, estado: 'ocupada'),
  ]
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

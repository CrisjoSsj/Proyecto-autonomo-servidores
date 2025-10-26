# app/channels/reservas_channel.rb
require 'json'
require_relative '../models/reserva'
require_relative '../utils/message_builder'
require_relative '../connections/connection_manager'

module ReservasChannel
  @@reservas = []

  def self.handle_message(ws, data)
    action = data['action']
    payload = data['payload']

    case action
    when 'crear'
      crear_reserva(ws, payload)
    when 'listar'
      listar_reservas(ws)
    when 'cancelar'
      cancelar_reserva(ws, payload)
    else
      ws.send(MessageBuilder.error('reservas', "Acción desconocida: #{action}").to_json)
    end
  end

  # ---------------------- MÉTODOS ----------------------

  def self.crear_reserva(ws, payload)
    reserva = Reserva.new(
      id_reserva: payload['id_reserva'],
      id_cliente: payload['id_cliente'],
      id_mesa: payload['id_mesa'],
      fecha: payload['fecha'],
      hora_inicio: payload['hora_inicio'],
      hora_fin: payload['hora_fin'],
      estado: 'activa',
      cliente: payload['cliente'],
      mesa: payload['mesa']
    )

    @@reservas << reserva

    mensaje = MessageBuilder.build('reservas', 'nueva_reserva', reserva.instance_variables_to_h)
    ConnectionManager.broadcast(mensaje.to_json)
  end

  def self.listar_reservas(ws)
    data = @@reservas.map { |r| r.instance_variables_to_h }
    mensaje = MessageBuilder.build('reservas', 'lista_reservas', data)
    ws.send(mensaje.to_json)
  end

  def self.cancelar_reserva(ws, payload)
    id = payload['id_reserva']
    reserva = @@reservas.find { |r| r.id_reserva == id }

    if reserva
      reserva.estado = 'cancelada'
      mensaje = MessageBuilder.build('reservas', 'reserva_cancelada', { id_reserva: id })
      ConnectionManager.broadcast(mensaje.to_json)
    else
      ws.send(MessageBuilder.error('reservas', "Reserva con id #{id} no encontrada").to_json)
    end
  end
end

# Helper para convertir objeto a hash sin repetir código
class Object
  def instance_variables_to_h
    instance_variables.map { |var| [var.to_s.delete('@'), instance_variable_get(var)] }.to_h
  end
end

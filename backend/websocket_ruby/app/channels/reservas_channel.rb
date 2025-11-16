# app/channels/reservas_channel.rb
require 'json'
require_relative '../utils/message_builder'
require_relative '../utils/api_client'

module ReservasChannel
  def self.handle_message(ws, data)
    action = data['action']&.to_s
    payload = data['payload'] || data['data'] || {}

    case action
    when 'subscribed'
      handle_subscribed(ws)
    when 'crear', 'create'
      handle_crear(ws, payload)
    when 'listar', 'list'
      handle_listar(ws)
    when 'cancelar', 'cancel'
      handle_cancelar(ws, payload)
    when 'actualizar', 'update'
      handle_actualizar(ws, payload)
    when 'eliminar', 'delete'
      handle_eliminar(ws, payload)
    else
      ws.send(MessageBuilder.build('reservas', 'error', { error: "Acción desconocida: #{action}" }).to_json)
    end
  rescue ApiClientError => e
    ws.send(MessageBuilder.build('reservas', 'error', { error: e.message, action: action }).to_json)
  rescue StandardError => e
    ws.send(MessageBuilder.build('reservas', 'error', { error: "Error procesando mensaje: #{e.message}" }).to_json)
    puts "⚠️ Error en ReservasChannel.handle_message: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}" unless ENV['RACK_ENV'] == 'production'
  end

  private

  def self.handle_subscribed(ws)
    reservas = ApiClient.list_reservas || []
    reservas_normalizadas = normalize_reservas(reservas)
    ws.send(MessageBuilder.build('reservas', 'estado_inicial', { reservas: reservas_normalizadas }).to_json)
  end

  def self.handle_crear(ws, payload)
    reserva_payload = build_reserva_payload(payload)
    reserva = ApiClient.create_reserva(reserva_payload)
    reserva_normalizada = normalize_reserva(reserva)
    ws.send(MessageBuilder.build('reservas', 'solicitud_enviada', { action: 'crear', reserva: reserva_normalizada }).to_json)
  end

  def self.handle_listar(ws)
    reservas = ApiClient.list_reservas || []
    reservas_normalizadas = normalize_reservas(reservas)
    ws.send(MessageBuilder.build('reservas', 'lista_reservas', { reservas: reservas_normalizadas }).to_json)
  end

  def self.handle_cancelar(ws, payload)
    id = resolve_reserva_id(payload)
    unless id
      ws.send(MessageBuilder.build('reservas', 'error', { error: 'No se proporcionó id válido para cancelar' }).to_json)
      return
    end

    reserva_existente = ApiClient.fetch_reserva(id)
    unless reserva_existente
      ws.send(MessageBuilder.build('reservas', 'error', { error: "Reserva con id #{id} no encontrada" }).to_json)
      return
    end

    reserva_normalizada = normalize_reserva(reserva_existente)
    reserva_actualizada = reserva_normalizada.merge('estado' => 'cancelada')
    ApiClient.update_reserva(reserva_actualizada)
    ws.send(MessageBuilder.build('reservas', 'solicitud_enviada', { action: 'cancelar', id_reserva: id }).to_json)
  end

  def self.handle_actualizar(ws, payload)
    id = resolve_reserva_id(payload)
    unless id
      ws.send(MessageBuilder.build('reservas', 'error', { error: 'No se proporcionó id válido para actualizar' }).to_json)
      return
    end

    reserva_payload = build_reserva_payload(payload)
    reserva_payload['id_reserva'] = id
    reserva = ApiClient.update_reserva(reserva_payload)
    reserva_normalizada = normalize_reserva(reserva['reserva'] || reserva)
    ws.send(MessageBuilder.build('reservas', 'solicitud_enviada', { action: 'actualizar', reserva: reserva_normalizada }).to_json)
  end

  def self.handle_eliminar(ws, payload)
    id = resolve_reserva_id(payload)
    unless id
      ws.send(MessageBuilder.build('reservas', 'error', { error: 'No se proporcionó id válido para eliminar' }).to_json)
      return
    end

    ApiClient.delete_reserva(id)
    ws.send(MessageBuilder.build('reservas', 'solicitud_enviada', { action: 'eliminar', id_reserva: id }).to_json)
  end

  def self.build_reserva_payload(payload)
    {
      'id_cliente' => (payload['id_cliente'] || payload[:id_cliente] || payload['cliente_id'] || payload[:cliente_id])&.to_i,
      'id_mesa' => (payload['id_mesa'] || payload[:id_mesa] || payload['mesa_id'] || payload[:mesa_id])&.to_i,
      'fecha' => (payload['fecha'] || payload[:fecha])&.to_s,
      'hora_inicio' => (payload['hora_inicio'] || payload[:hora_inicio] || payload['horaInicio'] || payload[:horaInicio])&.to_s,
      'hora_fin' => (payload['hora_fin'] || payload[:hora_fin] || payload['horaFin'] || payload[:horaFin])&.to_s,
      'estado' => (payload['estado'] || payload[:estado] || 'pendiente')&.to_s
    }
  end

  def self.resolve_reserva_id(payload)
    id = payload['id_reserva'] || payload[:id_reserva] || payload['id'] || payload[:id] || payload['reserva_id'] || payload[:reserva_id]
    id&.to_i
  end

  def self.normalize_reserva(reserva)
    return {} unless reserva

    hash = reserva.is_a?(Hash) ? reserva : (reserva.respond_to?(:to_h) ? reserva.to_h : {})
    {
      'id_reserva' => (hash['id_reserva'] || hash[:id_reserva] || hash['id'] || hash[:id])&.to_i,
      'id_cliente' => (hash['id_cliente'] || hash[:id_cliente] || hash['cliente_id'] || hash[:cliente_id])&.to_i,
      'id_mesa' => (hash['id_mesa'] || hash[:id_mesa] || hash['mesa_id'] || hash[:mesa_id])&.to_i,
      'fecha' => (hash['fecha'] || hash[:fecha])&.to_s,
      'hora_inicio' => (hash['hora_inicio'] || hash[:hora_inicio] || hash['horaInicio'] || hash[:horaInicio])&.to_s,
      'hora_fin' => (hash['hora_fin'] || hash[:hora_fin] || hash['horaFin'] || hash[:horaFin])&.to_s,
      'estado' => (hash['estado'] || hash[:estado] || 'pendiente')&.to_s
    }
  end

  def self.normalize_reservas(reservas)
    (reservas || []).map { |reserva| normalize_reserva(reserva) }
  end
end

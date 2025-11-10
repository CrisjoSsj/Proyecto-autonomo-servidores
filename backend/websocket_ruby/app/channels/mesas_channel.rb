# app/channels/mesas_channel.rb
require_relative '../utils/message_builder'
require_relative '../utils/api_client'

class MesasChannel
  # Maneja los mensajes entrantes desde server.rb
  def self.handle_message(ws, data)
    begin
      action = data["action"]
      payload = data["data"]

      case action
      when "subscribed"
        handle_subscribed(ws)
      when "update_estado"
        update_estado(ws, payload)
      when "agregar_mesa"
        agregar_mesa(ws, payload)
      when "eliminar_mesa"
        eliminar_mesa(ws, payload)
      else
        ws.send(MessageBuilder.build("mesas", "error", { error: "Acción no válida en canal mesas" }).to_json)
      end
    rescue => e
      # Responder con un mensaje estructurado de error para que el cliente pueda manejarlo
      err = MessageBuilder.build("mesas", "error", { error: "Error procesando mensaje: #{e.message}" })
      ws.send(err.to_json)
      puts "⚠️ Error en MesasChannel.handle_message: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}" unless ENV['RACK_ENV'] == 'production'
    end
  end

  # Enviar estado inicial al conectarse
  def self.handle_subscribed(ws)
    mesas = ApiClient.list_mesas || []
    mesas_serializadas = mesas.map { |m| normalize_mesa_hash(m) }
    msg = MessageBuilder.build("mesas", "estado_inicial", { mesas: mesas_serializadas })
    ws.send(msg.to_json)
  rescue ApiClientError => e
    ws.send(MessageBuilder.build("mesas", "error", { error: "No se pudieron obtener las mesas desde la API: #{e.message}" }).to_json)
  end

  # Actualizar el estado de una mesa
  def self.update_estado(ws, data)
    id = extract_id(data)
    nuevo_estado = data && (data["estado"] || data[:estado])

    unless id && nuevo_estado
      ws.send(MessageBuilder.build("mesas", "error", { error: "Faltan parámetros id_mesa o estado" }).to_json)
      return
    end

    mesa_api = ApiClient.fetch_mesa(id)
    unless mesa_api
      ws.send(MessageBuilder.build("mesas", "error", { error: "Mesa no encontrada en la API" }).to_json)
      return
    end

    mesa_normalizada = normalize_mesa_hash(mesa_api)
    payload = {
      id_mesa: mesa_normalizada["id_mesa"],
      numero: mesa_normalizada["numero"],
      capacidad: mesa_normalizada["capacidad"],
      estado: nuevo_estado
    }

    ApiClient.update_mesa(payload)

    ack = MessageBuilder.build("mesas", "actualizacion_enviada", payload.merge(channel_action: "update_estado"))
    ws.send(ack.to_json)
  rescue ApiClientError => e
    ws.send(MessageBuilder.build("mesas", "error", { error: e.message }).to_json)
  end

  # Agregar una nueva mesa
  def self.agregar_mesa(ws, data)
    begin
      numero = data && (data["numero"] || data[:numero])
      capacidad = data && (data["capacidad"] || data[:capacidad])
      estado = (data && (data["estado"] || data[:estado])) || "libre"
      id_solicitado = data && (data["id_mesa"] || data[:id_mesa] || data["id"] || data[:id])

      if numero.nil? || capacidad.nil?
        ws.send(MessageBuilder.build("mesas", "error", { error: "Faltan campos numero o capacidad" }).to_json)
        return
      end

      id_mesa = if id_solicitado
                  id_solicitado.to_i
                else
                  existentes = (ApiClient.list_mesas || []).map { |m| extract_id(m)&.to_i }.compact
                  (existentes.max || 0) + 1
                end

      payload = {
        id_mesa: id_mesa,
        numero: numero.to_i,
        capacidad: capacidad.to_i,
        estado: estado
      }

      creada = ApiClient.create_mesa(payload) || payload
      mesa_creada = normalize_mesa_hash(creada)

      ack = MessageBuilder.build("mesas", "creacion_enviada", mesa_creada.merge(channel_action: "agregar_mesa"))
      ws.send(ack.to_json)
    rescue => e
      ws.send(MessageBuilder.build("mesas", "error", { error: "Error agregando mesa: #{e.message}" }).to_json)
    end
  end

  # Eliminar una mesa
  def self.eliminar_mesa(ws, data)
    id = extract_id(data)
    unless id
      ws.send(MessageBuilder.build("mesas", "error", { error: "Falta id_mesa en eliminar_mesa" }).to_json)
      return
    end

    ApiClient.delete_mesa(id)
    ack = MessageBuilder.build("mesas", "eliminacion_enviada", { "id_mesa" => id.to_i, channel_action: "eliminar_mesa" })
    ws.send(ack.to_json)
  rescue ApiClientError => e
    ws.send(MessageBuilder.build("mesas", "error", { error: e.message }).to_json)
  end

  private

  def self.normalize_mesa_hash(mesa_hash)
    hash = if mesa_hash.is_a?(Hash)
             mesa_hash
           elsif mesa_hash.respond_to?(:to_h)
             mesa_hash.to_h
           else
             {}
           end

    id = hash["id_mesa"] || hash[:id_mesa] || hash["id"] || hash[:id]
    numero = hash["numero"] || hash[:numero]
    capacidad = hash["capacidad"] || hash[:capacidad]
    estado = hash["estado"] || hash[:estado] || hash["estado_mesa"] || hash[:estado_mesa] || "libre"

    {
      "id_mesa" => id && id.to_i,
      "numero" => numero && numero.to_i,
      "capacidad" => capacidad && capacidad.to_i,
      "estado" => estado.to_s
    }
  end

  def self.extract_id(data)
    return nil unless data

    value = if data.is_a?(Hash)
              data["id_mesa"] || data[:id_mesa] || data["mesa_id"] || data[:mesa_id] || data["id"] || data[:id]
            else
              data.respond_to?(:id_mesa) ? data.id_mesa : data
            end

    value && value.to_i
  end
end

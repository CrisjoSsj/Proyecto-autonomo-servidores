require 'time'
require_relative '../utils/message_builder'
require_relative '../utils/api_client'

class FilaVirtualChannel
  class << self
    def handle_message(ws, data)
      action  = data["action"]&.to_s
      payload = data["data"] || {}

      case action
      when "subscribed"
        handle_subscribed(ws)
      when "join"
        handle_join(ws, payload)
      when "leave"
        handle_leave(ws, payload)
      when "next"
        handle_next(ws, payload)
      when "confirm"
        handle_confirm(ws, payload)
      when "reset"
        handle_reset(ws)
      else
        ws.send(MessageBuilder.build("fila_virtual", "Acción desconocida", { action: action }).to_json)
      end
    rescue ApiClientError => e
      ws.send(MessageBuilder.build("fila_virtual", "error", { error: e.message, action: action }).to_json)
    rescue StandardError => e
      ws.send(MessageBuilder.build("fila_virtual", "error", { error: "Error procesando mensaje: #{e.message}" }).to_json)
      puts "⚠️ Error en FilaVirtualChannel.handle_message: #{e.class} - #{e.message}\n#{e.backtrace.join("\n")}" unless ENV['RACK_ENV'] == 'production'
    end

    private

    def handle_subscribed(ws)
      personas = ApiClient.list_fila_virtual || []
      ws.send(MessageBuilder.build("fila_virtual", "estado_inicial", { fila: normalize_personas(personas) }).to_json)
    end

    def handle_join(ws, payload)
      persona_payload = build_persona_payload(payload)
      persona = ApiClient.create_fila_virtual(persona_payload)
      
      # Notificar al cliente que envió la solicitud
      ws.send(MessageBuilder.build("fila_virtual", "solicitud_enviada", { action: "join", persona: persona }).to_json)
      
      # Hacer broadcast a todos los clientes de la nueva entrada en fila
      require_relative '../connections/connection_manager'
      broadcast_message = {
        "channel" => "fila_virtual",
        "action" => "nueva_entrada",
        "data" => {
          "persona" => persona,
          "timestamp" => Time.now.iso8601
        }
      }
      ConnectionManager.broadcast(broadcast_message)
    end

    def handle_leave(ws, payload)
      id = resolve_persona_id(payload)
      unless id
        ws.send(MessageBuilder.build("fila_virtual", "error", { error: "No se proporcionó id válido para salir de la fila" }).to_json)
        return
      end

      ApiClient.delete_fila_virtual(id)
      
      # Notificar al cliente que envió la solicitud
      ws.send(MessageBuilder.build("fila_virtual", "solicitud_enviada", { action: "leave", id: id }).to_json)
      
      # Hacer broadcast a todos los clientes de la salida de fila
      require_relative '../connections/connection_manager'
      broadcast_message = {
        "channel" => "fila_virtual",
        "action" => "salida_fila",
        "data" => {
          "id" => id,
          "timestamp" => Time.now.iso8601
        }
      }
      ConnectionManager.broadcast(broadcast_message)
    end

    def handle_next(ws, payload)
      id = resolve_persona_id(payload)

      resultado = if id
                    ApiClient.llamar_persona_fila(id)
                  else
                    ApiClient.admin_llamar_siguiente
                  end

      ws.send(MessageBuilder.build("fila_virtual", "solicitud_enviada", { action: "next", resultado: resultado }).to_json)
    end

    def handle_confirm(ws, payload)
      id = resolve_persona_id(payload)
      unless id
        ws.send(MessageBuilder.build("fila_virtual", "error", { error: "No se proporcionó id válido para confirmar" }).to_json)
        return
      end

      resultado = ApiClient.confirmar_persona_fila(id)
      ws.send(MessageBuilder.build("fila_virtual", "solicitud_enviada", { action: "confirm", resultado: resultado }).to_json)
    end

    def handle_reset(ws)
      personas = ApiClient.list_fila_virtual || []
      personas.each do |persona|
        id = persona["id"] || persona[:id]
        next unless id

        begin
          ApiClient.delete_fila_virtual(id)
        rescue ApiClientError => e
          puts "⚠️ Error eliminando persona #{id} durante reset: #{e.message}" unless ENV['RACK_ENV'] == 'production'
        end
      end

      ApiClient.admin_limpiar_vencidos
      ws.send(MessageBuilder.build("fila_virtual", "solicitud_enviada", { action: "reset" }).to_json)
    end

    def build_persona_payload(payload)
      cliente_id = payload["cliente_id"] || payload[:cliente_id] || payload["id_cliente"] || payload[:id_cliente]
      cliente_id ||= rand(1..1_000_000)

      nombre = payload["nombre"] || payload[:nombre] || "Cliente ##{cliente_id}"
      telefono = payload["telefono"] || payload[:telefono] || payload["phone"] || payload[:phone] || ""
      numero_personas = payload["numeroPersonas"] || payload[:numeroPersonas] || payload["numero_personas"] || payload[:numero_personas] || 2
      hora_llegada = payload["hora_llegada"] || payload[:hora_llegada] || payload["timestamp"] || payload[:timestamp] || Time.now.iso8601
      estado = payload["estado"] || payload[:estado] || "esperando"

      {
        cliente_id: cliente_id.to_i,
        nombre: nombre.to_s,
        telefono: telefono.to_s,
        numeroPersonas: numero_personas.to_i,
        hora_llegada: hora_llegada.to_s,
        estado: estado.to_s
      }
    end

    def resolve_persona_id(payload)
      id = payload["id"] || payload[:id] || payload["fila_id"] || payload[:fila_id] || payload["id_fila"] || payload[:id_fila]
      return id.to_i if id

      cliente_id = payload["cliente_id"] || payload[:cliente_id] || payload["id_cliente"] || payload[:id_cliente]
      telefono = payload["telefono"] || payload[:telefono] || payload["phone"] || payload[:phone]

      return nil unless cliente_id || telefono

      personas = ApiClient.list_fila_virtual || []
      encontrada = personas.find do |persona|
        matches_cliente = cliente_id && (persona["cliente_id"] || persona[:cliente_id]).to_i == cliente_id.to_i
        matches_telefono = telefono && (persona["telefono"] || persona[:telefono]).to_s == telefono.to_s
        matches_cliente || matches_telefono
      end

      encontrada && (encontrada["id"] || encontrada[:id])
    end

    def normalize_personas(personas)
      (personas || []).map do |persona|
        {
          "id" => persona["id"] || persona[:id],
          "cliente_id" => persona["cliente_id"] || persona[:cliente_id],
          "nombre" => persona["nombre"] || persona[:nombre],
          "telefono" => persona["telefono"] || persona[:telefono],
          "numeroPersonas" => persona["numeroPersonas"] || persona[:numeroPersonas] || persona["numero_personas"] || persona[:numero_personas],
          "posicion" => persona["posicion"] || persona[:posicion],
          "tiempoEstimado" => persona["tiempoEstimado"] || persona[:tiempoEstimado] || persona["tiempo_estimado"] || persona[:tiempo_estimado],
          "hora_llegada" => persona["hora_llegada"] || persona[:hora_llegada],
          "estado" => persona["estado"] || persona[:estado]
        }
      end
    end
  end
end

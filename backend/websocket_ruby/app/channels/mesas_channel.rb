# app/channels/mesas_channel.rb
require_relative '../utils/message_builder'
require_relative '../utils/data_store'
require_relative '../connections/connection_manager'

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
    mesas = DataStore.mesas.map { |m| serialize_mesa(m) }
    msg = MessageBuilder.build("mesas", "estado_inicial", { mesas: mesas })
    ws.send(msg.to_json)
  end

  # Actualizar el estado de una mesa
  def self.update_estado(ws, data)
    id = data && data["id_mesa"]
    nuevo_estado = data && data["estado"]

    unless id
      ws.send(MessageBuilder.build("mesas", "error", { error: "Falta id_mesa en update_estado" }).to_json)
      return
    end

    mesa = DataStore.mesas.find { |m| m.id_mesa == id || m.id_mesa == id.to_i }
    if mesa
      mesa.estado = nuevo_estado
      broadcast_message("mesa_actualizada", serialize_mesa(mesa))
    else
      ws.send(MessageBuilder.build("mesas", "error", { error: "Mesa no encontrada" }).to_json)
    end
  end

  # Agregar una nueva mesa
  def self.agregar_mesa(ws, data)
    begin
      numero = data && data["numero"]
      capacidad = data && data["capacidad"]
      estado = (data && data["estado"]) || "libre"

      if numero.nil? || capacidad.nil?
        ws.send(MessageBuilder.build("mesas", "error", { error: "Faltan campos numero o capacidad" }).to_json)
        return
      end

      nueva_mesa = Mesa.new(
        id_mesa: generar_id_unico,
        numero: numero.to_i,
        capacidad: capacidad.to_i,
        estado: estado
      )

      DataStore.mesas << nueva_mesa
      begin
        puts "➕ MesasChannel -> nueva_mesa (ruby obj): #{nueva_mesa.inspect}"
        puts "➕ MesasChannel -> nueva_mesa (serialized): #{serialize_mesa(nueva_mesa).inspect}"
      rescue => e
        puts "➕ MesasChannel -> error log nueva_mesa: #{e.message}"
      end

      broadcast_message("mesa_agregada", serialize_mesa(nueva_mesa))
    rescue => e
      ws.send(MessageBuilder.build("mesas", "error", { error: "Error agregando mesa: #{e.message}" }).to_json)
    end
  end

  # Eliminar una mesa
  def self.eliminar_mesa(ws, data)
    id = data && data["id_mesa"]
    unless id
      ws.send(MessageBuilder.build("mesas", "error", { error: "Falta id_mesa en eliminar_mesa" }).to_json)
      return
    end

    mesa = DataStore.mesas.find { |m| m.id_mesa == id || m.id_mesa == id.to_i }

    if mesa
      DataStore.mesas.delete(mesa)
      broadcast_message("mesa_eliminada", { id_mesa: mesa.id_mesa })
    else
      ws.send(MessageBuilder.build("mesas", "error", { error: "Mesa no encontrada" }).to_json)
    end
  end

  private

  # 🔁 Envía mensaje a todos los clientes conectados
  def self.broadcast_message(type, data)
    msg = MessageBuilder.build("mesas", type, data)
    # Log del mensaje tal como lo construye el channel (antes de la serialización profunda)
    begin
      puts "🔁 MesasChannel -> Broadcast (pre-serialize): #{msg.inspect}"
    rescue => e
      puts "🔁 MesasChannel -> Error inspeccionando mensaje: #{e.message}"
    end
    ConnectionManager.broadcast(msg)
  end

  def self.generar_id_unico
    ids = DataStore.mesas.map(&:id_mesa)
    (ids.max || 0) + 1
  end

  # Convierte una instancia Mesa a un hash simple serializable a JSON
  def self.serialize_mesa(mesa)
    {
      "id_mesa" => mesa.id_mesa,
      "numero" => mesa.numero,
      "capacidad" => mesa.capacidad,
      "estado" => mesa.estado
    }
  end
end

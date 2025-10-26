# app/channels/mesas_channel.rb
require_relative '../utils/message_builder'
require_relative '../utils/data_store'
require_relative '../connections/connection_manager'

class MesasChannel
  # Maneja los mensajes entrantes desde server.rb
  def self.handle_message(ws, data)
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
      ws.send({ error: "Acción no válida en canal mesas" }.to_json)
    end
  end

  # Enviar estado inicial al conectarse
  def self.handle_subscribed(ws)
    mesas = DataStore.mesas
    msg = MessageBuilder.build("mesas", "estado_inicial", { mesas: mesas })
    ws.send(msg.to_json)
  end

  # Actualizar el estado de una mesa
  def self.update_estado(ws, data)
    id = data["id_mesa"]
    nuevo_estado = data["estado"]

    mesa = DataStore.mesas.find { |m| m.id_mesa == id }
    if mesa
      mesa.estado = nuevo_estado
      broadcast_message("mesa_actualizada", mesa)
    else
      ws.send({ error: "Mesa no encontrada" }.to_json)
    end
  end

  # Agregar una nueva mesa
  def self.agregar_mesa(ws, data)
    nueva_mesa = Mesa.new(
      id_mesa: generar_id_unico,
      numero: data["numero"],
      capacidad: data["capacidad"],
      estado: data["estado"] || "libre"
    )

    DataStore.mesas << nueva_mesa
    broadcast_message("mesa_agregada", nueva_mesa)
  end

  # Eliminar una mesa
  def self.eliminar_mesa(ws, data)
    id = data["id_mesa"]
    mesa = DataStore.mesas.find { |m| m.id_mesa == id }

    if mesa
      DataStore.mesas.delete(mesa)
      broadcast_message("mesa_eliminada", { id_mesa: id })
    else
      ws.send({ error: "Mesa no encontrada" }.to_json)
    end
  end

  private

  # 🔁 Envía mensaje a todos los clientes conectados
  def self.broadcast_message(type, data)
    msg = MessageBuilder.build("mesas", type, data)
    ConnectionManager.broadcast(msg)
  end

  def self.generar_id_unico
    ids = DataStore.mesas.map(&:id_mesa)
    (ids.max || 0) + 1
  end
end

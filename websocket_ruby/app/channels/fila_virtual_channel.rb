# app/channels/fila_virtual_channel.rb
require_relative '../connections/connection_manager'
require_relative '../utils/message_builder'

class FilaVirtualChannel
  def self.handle_message(ws, data)
    case data["action"]
    when "join"
      msg = MessageBuilder.build("FilaVirtual", "Cliente unido a la fila", data)
      ConnectionManager.broadcast(msg)
    when "leave"
      msg = MessageBuilder.build("FilaVirtual", "Cliente salió de la fila", data)
      ConnectionManager.broadcast(msg)
    else
      ws.send({ error: "Acción no reconocida" }.to_json)
    end
  end
end

require 'json'
require_relative '../utils/message_builder'
require_relative '../connections/connection_manager'

class FilaVirtualChannel
  def self.handle_message(ws, data)
    action = data["action"]
    cliente = data["cliente"]

    case action
    when "join"
      message = MessageBuilder.build("fila_virtual", "#{cliente} se unió a la fila", data)
      ConnectionManager.broadcast(message)
    when "leave"
      message = MessageBuilder.build("fila_virtual", "#{cliente} salió de la fila", data)
      ConnectionManager.broadcast(message)
    else
      ws.send(MessageBuilder.build("fila_virtual", "Acción desconocida", data).to_json)
    end
  end
end

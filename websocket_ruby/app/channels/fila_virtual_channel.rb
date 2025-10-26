require 'json'
require_relative '../utils/message_builder'
require_relative '../models/manager/fila_virtual_manager'

class FilaVirtualChannel
  def self.handle_message(ws, data)
    action  = data["action"]
    cliente = data["cliente"]

    case action
    when "join"
      FilaVirtualManager.join(cliente)
      msg = MessageBuilder.build("fila_virtual", "#{cliente} se unió a la fila", data)
      ws.send(msg.to_json)

    when "leave"
      FilaVirtualManager.leave(cliente)
      msg = MessageBuilder.build("fila_virtual", "#{cliente} salió de la fila", data)
      ws.send(msg.to_json)

    when "next"
      siguiente = FilaVirtualManager.next_cliente
      msg = MessageBuilder.build("fila_virtual", "Siguiente cliente: #{siguiente || 'Nadie en la fila'}", data)
      ws.send(msg.to_json)

    when "reset"
      FilaVirtualManager.reset
      msg = MessageBuilder.build("fila_virtual", "Fila reiniciada", data)
      ws.send(msg.to_json)

    else
      ws.send(MessageBuilder.build("fila_virtual", "Acción desconocida", data).to_json)
    end
  end
end

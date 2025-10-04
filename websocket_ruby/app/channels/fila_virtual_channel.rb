require_relative '../utils/message_builder'

class FilaVirtualChannel
  def self.notify_change(manager, cliente, estado)
    message = MessageBuilder.build('fila_virtual_update', {
      cliente: cliente,
      nuevo_estado: estado
    })
    manager.broadcast(message)
  end
end

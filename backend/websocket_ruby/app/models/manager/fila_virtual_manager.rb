# app/models/fila_virtual_manager.rb
require 'json'

class FilaVirtualManager
  @queue = []

  class << self
    attr_reader :queue

    def join(cliente)
      unless @queue.include?(cliente)
        @queue << cliente
      end
      broadcast_state
    end

    def leave(cliente)
      @queue.delete(cliente)
      broadcast_state
    end

    def next_cliente
      cliente = @queue.shift
      broadcast_state
      cliente
    end

    def reset
      @queue.clear
      broadcast_state
    end

    def current_state
      {
        channel: "fila_virtual",
        message: "Estado actualizado de la fila",
        data: { queue: @queue }
      }
    end

    def broadcast_state
      if defined?(ConnectionManager)
        ConnectionManager.broadcast(current_state)
      end
    end
  end
end

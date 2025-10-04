require 'eventmachine'
require 'faye/websocket'
require 'json'
require_relative './app/connections/connection_manager'
require_relative './app/utils/message_builder'

class WebSocketServer
  def initialize
    @clients = ConnectionManager.new
  end

  def start
    EM.run do
      puts "Servidor WebSocket corriendo en ws://localhost:8080"

      # Crea un servidor HTTP base
      EM::start_server "0.0.0.0", 8080, Module.new {
        define_method(:receive_data) { |data| }
      }

      # Escucha conexiones entrantes
      EM::start_server "0.0.0.0", 8080, ConnectionHandler, @clients
    end
  end
end

module ConnectionHandler
  def initialize(clients)
    @clients = clients
  end

  def post_init
    @ws = Faye::WebSocket.new(self, [], {})
    @ws.on :open do |_|
      @clients.add(@ws)
      puts "Cliente conectado"
    end

    @ws.on :message do |event|
      data = JSON.parse(event.data)
      puts "Mensaje recibido: #{data}"
      @clients.broadcast(MessageBuilder.build('info', data))
    end

    @ws.on :close do |_|
      @clients.remove(@ws)
      puts "Cliente desconectado"
    end
  end
end

# Inicializar servidor
WebSocketServer.new.start

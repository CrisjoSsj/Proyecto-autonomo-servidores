require 'eventmachine'
require 'faye/websocket'
require 'json'
require_relative './app/connections/connection_manager'
require_relative './app/utils/message_builder'

class WebSocketServer
  def initialize
    @clients = ConnectionManager.new
    # Expose to the HTTP broadcast handler
    $connection_manager = @clients
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

# Simple HTTP POST /broadcast handler using EventMachine on port 8081
module EMHTTPHandler
  def receive_data(data)
    @buffer ||= ''
    @buffer << data
    # very simple HTTP parsing: wait until we have full headers
    if @buffer.include?("\r\n\r\n")
      headers, body = @buffer.split("\r\n\r\n", 2)
      request_line = headers.lines[0]
      method, path = request_line.split[0], request_line.split[1]
      if method == 'POST' && path == '/broadcast'
        begin
          # try to parse Content-Length to know body length
          content_length = 0
          headers.each_line do |ln|
            if ln.downcase.start_with?('content-length:')
              content_length = ln.split(':',2)[1].strip.to_i
            end
          end

          # if body incomplete, wait
          if body.nil? || body.length < content_length
            return
          end

          payload = JSON.parse(body[0, content_length])
          msg = MessageBuilder.build('broadcast', payload)
          $connection_manager.broadcast(msg) if $connection_manager
          response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 13\r\n\r\n{\"status\":\"ok\"}"
          send_data(response)
        rescue => e
          body = ({error: e.message}).to_json
          response = "HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\nContent-Length: #{body.bytesize}\r\n\r\n#{body}"
          send_data(response)
        end
      else
        send_data("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n")
      end
      close_connection_after_writing
    end
  end
end

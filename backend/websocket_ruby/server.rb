# server.rb
require 'em-websocket'
require 'json'
require_relative './app/connections/connection_manager'
require_relative './app/channels/fila_virtual_channel'
require_relative './app/channels/mesas_channel'
require_relative './app/channels/reservas_channel'

PORT = 3001
HTTP_PORT = 3002

module EMHTTPHandler
  def receive_data(data)
    @buffer ||= ''
    @buffer << data
    return unless @buffer.include?("\r\n\r\n")

    headers, body = @buffer.split("\r\n\r\n", 2)
    request_line = headers.lines[0]
    method, path = request_line.split[0], request_line.split[1]

    # Parse Content-Length if present
    content_length = 0
    headers.each_line do |ln|
      if ln.downcase.start_with?('content-length:')
        content_length = ln.split(':',2)[1].strip.to_i
      end
    end

    if body.nil? || body.length < content_length
      # wait for full body
      return
    end

    if method == 'POST' && path == '/broadcast'
      begin
        payload = JSON.parse(body[0, content_length])
        ConnectionManager.broadcast(payload)
        response_body = { status: 'ok' }.to_json
        response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: #{response_body.bytesize}\r\n\r\n#{response_body}"
        send_data(response)
      rescue => e
        err = { error: e.message }.to_json
        response = "HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\nContent-Length: #{err.bytesize}\r\n\r\n#{err}"
        send_data(response)
      end
    else
      send_data("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n")
    end

    close_connection_after_writing
    @buffer = ''
  end
end

EventMachine.run do
  puts "Servidor WebSocket ejecutándose en ws://localhost:#{PORT}"

  # Start HTTP listener for broadcasts
  EventMachine.start_server '0.0.0.0', HTTP_PORT, EMHTTPHandler
  puts "HTTP broadcast endpoint escuchando en http://localhost:#{HTTP_PORT}/broadcast"

  EventMachine::WebSocket.start(host: "0.0.0.0", port: PORT) do |ws|
    ws.onopen do
      ConnectionManager.add(ws)
      puts "Cliente conectado"
    end

    ws.onmessage do |msg|
      data = JSON.parse(msg)
      case data["channel"]
      when "fila_virtual"
        FilaVirtualChannel.handle_message(ws, data)
      when "mesas"
        MesasChannel.handle_message(ws, data)
      when "reservas"
        ReservasChannel.handle_message(ws, data)
      else
        ws.send({ error: "Canal desconocido" }.to_json)
      end
    end

    ws.onclose do
      ConnectionManager.remove(ws)
      puts "Cliente desconectado"
    end
  end
end

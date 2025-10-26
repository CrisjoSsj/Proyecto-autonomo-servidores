class ConnectionManager
  @connections = []

  class << self
    def add(ws)
      @connections << ws
      puts "🟢 Cliente agregado. Total conexiones: #{@connections.size}"
    end

    def remove(ws)
      @connections.delete(ws)
      puts "🔴 Cliente eliminado. Total conexiones: #{@connections.size}"
    end

    def broadcast(message)
      puts "📢 Enviando broadcast a #{@connections.size} clientes"
      @connections.each do |conn|
        begin
          conn.send(message.to_json)
        rescue => e
          puts "⚠️ Error enviando mensaje: #{e.message}"
        end
      end
    end
  end
end



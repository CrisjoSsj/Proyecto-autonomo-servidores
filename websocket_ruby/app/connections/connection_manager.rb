class ConnectionManager
  @connections = []

  class << self
    def add(ws)
      @connections << ws
    end

    def remove(ws)
      @connections.delete(ws)
    end

    def broadcast(message)
      puts "📢 Enviando broadcast: #{message}"
      @connections.each do |conn|
        conn.send(message.to_json)
      end
    end
  end
end


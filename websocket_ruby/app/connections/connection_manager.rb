# app/connections/connection_manager.rb
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
      @connections.each { |c| c.send(message.to_json) }
    end
  end
end

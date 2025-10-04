class ConnectionManager
  def initialize
    @clients = []
  end

  def add(ws)
    @clients << ws
  end

  def remove(ws)
    @clients.delete(ws)
  end

  def broadcast(message)
    @clients.each { |client| client.send(message) }
  end
end

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
          # Asegurarse de convertir cualquier objeto Ruby a estructuras primarias
          serialized = deep_serialize(message)
          json_payload = serialized.to_json
          # Log para depuración: mostrar exactamente el JSON enviado
          puts "📤 Broadcast payload: #{json_payload}"
          conn.send(json_payload)
        rescue => e
          puts "⚠️ Error enviando mensaje: #{e.message}"
        end
      end
    end
  end
end

private

# Serializa recursivamente objetos Ruby a hashes/arrays/valores primitivos
def deep_serialize(obj)
  case obj
  when String, Numeric, TrueClass, FalseClass, NilClass
    obj
  when Array
    obj.map { |e| deep_serialize(e) }
  when Hash
    # Normalize keys to symbols or strings consistently
    obj.each_with_object({}) do |(k, v), h|
      key = k.to_s
      h[key] = deep_serialize(v)
    end
  else
    # Si el objeto provee as_json / to_h / to_hash, intentarlo
    if obj.respond_to?(:as_json)
      deep_serialize(obj.as_json)
    elsif obj.respond_to?(:to_h)
      deep_serialize(obj.to_h)
    elsif obj.respond_to?(:to_hash)
      deep_serialize(obj.to_hash)
    else
      # Fallback: serializar variables de instancia a un hash
      ivs = obj.instance_variables
      if ivs.empty?
        obj.to_s
      else
        ivs.each_with_object({}) do |iv, h|
          name = iv.to_s.sub('@', '')
          h[name] = deep_serialize(obj.instance_variable_get(iv))
        end
      end
    end
  end
end



require 'net/http'
require 'uri'
require 'json'

class ApiClientError < StandardError; end

module ApiClient
  DEFAULT_TIMEOUT = 5
  BASE_URL = ENV.fetch('API_BASE_URL', 'http://localhost:8000')

  class << self
    def list_mesas
      request('Get', '/mesas/')
    end

    def fetch_mesa(id)
      request('Get', "/mesa/#{id}")
    end

    def create_mesa(attributes)
      request('Post', '/mesa/', attributes)
    end

    def update_mesa(attributes)
      request('Put', '/mesa/', attributes)
    end

    def delete_mesa(id)
      request('Delete', "/mesa/#{id}")
    end

    def list_fila_virtual
      request('Get', '/fila-virtual/')
    end

    def create_fila_virtual(attributes)
      request('Post', '/fila-virtual/', attributes)
    end

    def llamar_persona_fila(fila_id)
      request('Put', "/fila-virtual/#{fila_id}/siguiente")
    end

    def confirmar_persona_fila(fila_id)
      request('Put', "/fila-virtual/#{fila_id}/confirmar")
    end

    def delete_fila_virtual(fila_id)
      request('Delete', "/fila-virtual/#{fila_id}")
    end

    def admin_llamar_siguiente
      request('Post', '/fila-virtual/admin/llamar-siguiente')
    end

    def admin_limpiar_vencidos
      request('Post', '/fila-virtual/admin/limpiar-vencidos')
    end

    private

    def request(method_name, path, body = nil)
      uri = build_uri(path)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.read_timeout = DEFAULT_TIMEOUT
      http.open_timeout = DEFAULT_TIMEOUT

      request_class = Net::HTTP.const_get(method_name.capitalize)
      req = request_class.new(uri)
      req['Content-Type'] = 'application/json'
      req['Accept'] = 'application/json'
      req.body = JSON.generate(body) if body

      response = http.request(req)
      parse_response(response)
    rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH => e
      raise ApiClientError, "No se pudo conectar con la API REST: #{e.message}"
    rescue Timeout::Error => e
      raise ApiClientError, "La solicitud a la API REST excedió el tiempo límite: #{e.message}"
    rescue ApiClientError
      raise
    rescue StandardError => e
      raise ApiClientError, "Error inesperado al llamar a la API REST: #{e.message}"
    end

    def build_uri(path)
      sanitized = path.start_with?('/') ? path : "/#{path}"
      URI.join(BASE_URL, sanitized)
    end

    def parse_response(response)
      code = response.code.to_i
      body = response.body.to_s.strip

      if code >= 200 && code < 300
        return nil if body.empty?

        begin
          JSON.parse(body)
        rescue JSON::ParserError
          body
        end
      else
        message = if body.empty?
                    "HTTP #{code}"
                  else
                    begin
                      parsed = JSON.parse(body)
                      parsed.is_a?(Hash) ? parsed['detail'] || parsed['error'] || parsed : parsed
                    rescue JSON::ParserError
                      body
                    end
                  end
        raise ApiClientError, "Error HTTP #{code}: #{message}"
      end
    end
  end
end



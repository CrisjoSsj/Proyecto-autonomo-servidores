
require 'time'

class MessageBuilder
  # Construye un hash con claves string y timestamp en formato ISO8601
  def self.build(channel, message, data = {})
    {
      "channel" => channel.to_s,
      "message" => message.to_s,
      "data" => data,
      "timestamp" => Time.now.iso8601
    }
  end
end


class MessageBuilder
  def self.build(channel, message, data = {})
    {
      channel: channel,
      message: message,
      data: data,
      timestamp: Time.now
    }
  end
end

# app/models/utils/message_builder.rb
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

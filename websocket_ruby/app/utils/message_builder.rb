class MessageBuilder
  def self.build(type, data)
    {
      type: type,
      timestamp: Time.now,
      payload: data
    }.to_json
  end
end

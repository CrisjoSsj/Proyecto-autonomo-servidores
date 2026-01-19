# ===========================================
# WebSocket Server - Ruby
# ===========================================

FROM ruby:3.2-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar Gemfile
COPY Gemfile Gemfile.lock* ./

# Instalar gemas
RUN bundle install

# Copiar código
COPY . .

# Exponer puertos
EXPOSE 3001

# Comando de inicio
CMD ["ruby", "server.rb"]

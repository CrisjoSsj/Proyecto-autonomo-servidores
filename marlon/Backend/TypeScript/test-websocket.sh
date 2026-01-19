#!/bin/bash

echo "🧪 Testing WebSocket Server Integration"
echo "======================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Verificar que el servidor esté corriendo
echo "1️⃣  Verificando que el servidor WebSocket esté corriendo..."
if curl -s http://localhost:4000/api/health > /dev/null; then
    log_success "Servidor WebSocket activo en puerto 4000"
else
    log_error "Servidor WebSocket no responde en puerto 4000"
    echo "   Inicia el servidor con: npm run start:dev"
    exit 1
fi

echo ""

# 2. Verificar endpoint del dashboard
echo "2️⃣  Verificando endpoint del dashboard..."
DASHBOARD_RESPONSE=$(curl -s http://localhost:4000/api/dashboard)
if echo "$DASHBOARD_RESPONSE" | grep -q "metrics"; then
    log_success "Endpoint /api/dashboard funciona"
    echo "   Respuesta: $(echo $DASHBOARD_RESPONSE | head -c 100)..."
else
    log_error "Endpoint /api/dashboard no retorna datos válidos"
fi

echo ""

# 3. Verificar endpoint de estadísticas
echo "3️⃣  Verificando endpoint de estadísticas..."
STATS_RESPONSE=$(curl -s http://localhost:4000/api/dashboard/stats)
if echo "$STATS_RESPONSE" | grep -q "services\|clients"; then
    log_success "Endpoint /api/dashboard/stats funciona"
else
    log_info "Endpoint /api/dashboard/stats retornó: $(echo $STATS_RESPONSE | head -c 100)..."
fi

echo ""

# 4. Probar emisión de evento
echo "4️⃣  Probando emisión de evento de negocio..."
EMIT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/dashboard/emit-event \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reserva:creada",
    "data": {
      "reserva": {
        "id": 999,
        "clienteId": 123,
        "estado": "confirmada",
        "fecha": "2024-11-15",
        "hora": "14:30",
        "totalEstimado": 50000
      }
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }')

if echo "$EMIT_RESPONSE" | grep -q "success"; then
    log_success "Evento de prueba emitido exitosamente"
    echo "   Respuesta: $EMIT_RESPONSE"
else
    log_error "Error emitiendo evento"
    echo "   Respuesta: $EMIT_RESPONSE"
fi

echo ""

# 5. Verificar eventos recientes
echo "5️⃣  Verificando eventos recientes..."
EVENTS_RESPONSE=$(curl -s http://localhost:4000/api/dashboard/events)
if echo "$EVENTS_RESPONSE" | grep -q "reserva:creada\|events"; then
    log_success "Eventos capturados correctamente"
    echo "   Últimos eventos: $(echo $EVENTS_RESPONSE | head -c 150)..."
else
    log_info "Respuesta de eventos: $EVENTS_RESPONSE"
fi

echo ""

# 6. Verificar notificación a rol
echo "6️⃣  Probando notificación a rol..."
ROLE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/dashboard/notify-role \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "event": "test_event",
    "payload": {"test": true}
  }')

if echo "$ROLE_RESPONSE" | grep -q "success"; then
    log_success "Notificación a rol enviada"
else
    log_info "Respuesta: $ROLE_RESPONSE"
fi

echo ""

# 7. Verificar métricas
echo "7️⃣  Verificando métricas del sistema..."
METRICS_RESPONSE=$(curl -s http://localhost:4000/api/dashboard/metrics)
if echo "$METRICS_RESPONSE" | grep -q "activeConnections\|eventsEmitted"; then
    log_success "Métricas disponibles"
    echo "   Métricas: $METRICS_RESPONSE"
else
    log_info "Respuesta de métricas: $METRICS_RESPONSE"
fi

echo ""

# Resumen
echo "======================================="
echo "🎉 Pruebas completadas!"
echo ""
log_info "Dashboard del servidor: http://localhost:5173/negocio/dashboard/"
log_info "API Health: http://localhost:4000/api/health"
log_info "Documentación: Ver TypeScript/WEBSOCKET_INTEGRATION.md"
echo ""

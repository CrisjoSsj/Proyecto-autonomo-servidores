# 🔄 REINICIAR N8N - Chuwue Grill
# Script para parar, limpiar y reiniciar n8n con las credenciales correctas

Write-Host "`n" + ("="*70) -ForegroundColor Cyan
Write-Host "   REINICIANDO N8N (5678)" -ForegroundColor Cyan
Write-Host ("="*70) -ForegroundColor Cyan + "`n"

# 1. Detener n8n si está corriendo
Write-Host "  Deteniendo n8n..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null
Start-Sleep -Seconds 2

# 2. Limpiar procesos residuales
Write-Host "🧹 Limpiando procesos residuales..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*n8n*" -or $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 3. Información de credenciales
Write-Host "`n CREDENCIALES DE N8N:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "   URL:      http://localhost:5678"
Write-Host "   Email:    admin@chuwue.com"
Write-Host "   Password: admin123"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

# 4. Iniciar n8n
Write-Host "Iniciando n8n..." -ForegroundColor Green
Write-Host "Espera a que se inicialice completamente (30-60 segundos)...`n" -ForegroundColor Yellow

# Si n8n está instalado globalmente
$n8nPath = (Get-Command n8n -ErrorAction SilentlyContinue).Source

if ($n8nPath) {
    Write-Host " n8n encontrado: $n8nPath" -ForegroundColor Green
    & n8n start
} else {
    Write-Host "  n8n no está instalado globalmente" -ForegroundColor Yellow
    Write-Host "`n Instrucciones para instalar n8n:" -ForegroundColor Yellow
    Write-Host "  npm install -g n8n"
    Write-Host "  O si usas Docker:"
    Write-Host "  docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n"
    Write-Host "`n"
}

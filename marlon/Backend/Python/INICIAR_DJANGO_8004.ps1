#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Inicia Django en el puerto 8004 para el proyecto Marlon
    
.DESCRIPTION
    Este script activa el entorno virtual, aplica migraciones
    e inicia el servidor Django en el puerto 8004.
    
.EXAMPLE
    .\INICIAR_DJANGO_8004.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 INICIAR MARLON DJANGO - PUERTO 8004                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "manage.py")) {
    Write-Host "❌ ERROR: manage.py no encontrado" -ForegroundColor Red
    Write-Host "Este script debe ejecutarse desde: marlon\Backend\Python\" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Activar entorno virtual
Write-Host "📦 Activando entorno virtual..." -ForegroundColor Yellow
$venvPath = ".\venv\Scripts\Activate.ps1"

if (-not (Test-Path $venvPath)) {
    Write-Host "❌ ERROR: Entorno virtual no encontrado en $venvPath" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

& $venvPath

Write-Host "✅ Entorno virtual activado" -ForegroundColor Green

# Verificar puerto
Write-Host ""
Write-Host "🔍 Verificando disponibilidad del puerto 8004..." -ForegroundColor Yellow

$portCheck = netstat -ano | Select-String ":8004" | Select-String "LISTENING"

if ($portCheck) {
    Write-Host "⚠️  ADVERTENCIA: El puerto 8004 ya está en uso" -ForegroundColor Yellow
    Write-Host $portCheck
    $confirm = Read-Host "¿Deseas continuar de todas formas? (s/n)"
    if ($confirm -ne "s" -and $confirm -ne "S") {
        exit 1
    }
}
else {
    Write-Host "✅ Puerto 8004 disponible" -ForegroundColor Green
}

# Aplicar migraciones
Write-Host ""
Write-Host "🔄 Verificando migraciones..." -ForegroundColor Yellow
python manage.py migrate --noinput 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones aplicadas" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Advertencia: Hubo un problema con las migraciones" -ForegroundColor Yellow
    Write-Host "Continuando de todas formas..." -ForegroundColor Yellow
}

# Mostrar información
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                 🚀 INICIANDO SERVIDOR DJANGO                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Servidor disponible en:" -ForegroundColor Cyan
Write-Host "  • http://localhost:8004" -ForegroundColor Green
Write-Host "  • http://127.0.0.1:8004" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints importantes:" -ForegroundColor Cyan
Write-Host "  🍽️  Platos:      http://localhost:8004/platos/" -ForegroundColor Green
Write-Host "  📂 Categorías:  http://localhost:8004/categorias/" -ForegroundColor Green
Write-Host "  👤 Admin:       http://localhost:8004/admin/" -ForegroundColor Green
Write-Host "  🔗 Webhooks:    http://localhost:8004/webhooks/" -ForegroundColor Green
Write-Host "  📡 API REST:    http://localhost:8004/api_rest/" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona CTRL+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
python manage.py runserver 0.0.0.0:8004

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERROR: El servidor no se pudo iniciar" -ForegroundColor Red
    Write-Host "Posibles razones:" -ForegroundColor Yellow
    Write-Host "  • El puerto 8004 ya está en uso" -ForegroundColor Yellow
    Write-Host "  • Hay un error en la configuración de Django" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

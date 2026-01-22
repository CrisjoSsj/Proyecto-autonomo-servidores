@echo off
REM Script para iniciar Django en el puerto 8004
REM Lugar: marlon\Backend\Python\

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                 INICIAR MARLON DJANGO - PUERTO 8004                        ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

REM Verificar que estamos en el directorio correcto
if not exist "manage.py" (
    echo ❌ ERROR: manage.py no encontrado
    echo Este script debe ejecutarse desde: marlon\Backend\Python\
    pause
    exit /b 1
)

REM Activar entorno virtual
echo 📦 Activando entorno virtual...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo ❌ ERROR: No se pudo activar el entorno virtual
    pause
    exit /b 1
)

echo ✅ Entorno virtual activado

REM Aplicar migraciones si es necesario
echo.
echo 🔄 Verificando migraciones...
python manage.py migrate --noinput

if errorlevel 1 (
    echo ⚠️  Advertencia: Hubo un problema con las migraciones
    echo Continuando de todas formas...
)

REM Iniciar servidor
echo.
echo 🚀 Iniciando Django en puerto 8004...
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║ Servidor disponible en:  http://localhost:8004                            ║
echo ║                          http://127.0.0.1:8004                            ║
echo ║                                                                            ║
echo ║ Endpoints importantes:                                                    ║
echo ║  • Platos:      http://localhost:8004/platos/                            ║
echo ║  • Categorías:  http://localhost:8004/categorias/                        ║
echo ║  • Admin:       http://localhost:8004/admin/                             ║
echo ║  • Webhooks:    http://localhost:8004/webhooks/                          ║
echo ║  • API:         http://localhost:8004/api_rest/                          ║
echo ║                                                                            ║
echo ║ Presiona CTRL+C para detener el servidor                                 ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.

python manage.py runserver 0.0.0.0:8004

if errorlevel 1 (
    echo.
    echo ❌ ERROR: El servidor no se pudo iniciar
    echo Posibles razones:
    echo   • El puerto 8004 ya está en uso
    echo   • Hay un error en la configuración de Django
    pause
    exit /b 1
)

pause

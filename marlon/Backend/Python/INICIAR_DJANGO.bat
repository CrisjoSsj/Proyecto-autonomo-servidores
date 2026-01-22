@echo off
REM =====================================================
REM INICIAR DJANGO - WEBHOOKS MARLON
REM =====================================================

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           INICIANDO DJANGO - WEBHOOKS MARLON              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Cambiar a directorio Python
cd /d "C:\Users\joustin\Desktop\Proyecto-autonomo-servidores\marlon\Backend\Python"

REM Verificar que existe venv
if not exist "venv\Scripts\python.exe" (
    echo ERROR: No se encontró el ambiente virtual
    echo.
    echo Solución: Crea el ambiente virtual con:
    echo   python -m venv venv
    echo.
    pause
    exit /b 1
)

echo ✓ Ambiente virtual encontrado
echo.
echo Instalando dependencias necesarias...
call venv\Scripts\pip.exe install -q django djangorestframework django-cors-headers python-dotenv
echo ✓ Dependencias OK
echo.

echo Iniciando Django en http://localhost:8000
echo.
echo ⏳ Espera a ver: "Starting development server at..."
echo.
echo Para detener: Presiona CTRL+C
echo.

REM Ejecutar Django
call venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

pause

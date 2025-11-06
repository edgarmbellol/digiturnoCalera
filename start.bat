@echo off
echo ============================================
echo   Sistema de Digiturno
echo   Hospital Divino Salvador de Sopo
echo ============================================
echo.

REM Verificar si existe el entorno virtual del backend
if not exist "backend\venv\" (
    echo [ERROR] No se encuentra el entorno virtual de Python.
    echo Por favor ejecute primero: setup.bat
    pause
    exit /b 1
)

REM Verificar si existen los node_modules del frontend
if not exist "frontend\node_modules\" (
    echo [ERROR] No se encuentran las dependencias de Node.js.
    echo Por favor ejecute primero: setup.bat
    pause
    exit /b 1
)

echo [1/3] Iniciando Backend (FastAPI)...
start "Digiturno - Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

echo [2/3] Esperando 3 segundos...
timeout /t 3 /nobreak > nul

echo [3/3] Iniciando Frontend (React + Vite)...
start "Digiturno - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo   Sistema Iniciado Correctamente
echo ============================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Presione cualquier tecla para abrir el navegador...
pause > nul

REM Abrir el navegador en la pagina principal
start http://localhost:3000

echo.
echo Para detener el sistema, cierre las ventanas del Backend y Frontend
echo.


@echo off
echo ============================================
echo   Deteniendo Sistema de Digiturno
echo ============================================
echo.

echo Cerrando Backend...
taskkill /FI "WindowTitle eq Digiturno - Backend*" /T /F 2>nul
if errorlevel 1 (
    echo No se encontro proceso del Backend en ejecucion
) else (
    echo [OK] Backend detenido
)

echo.
echo Cerrando Frontend...
taskkill /FI "WindowTitle eq Digiturno - Frontend*" /T /F 2>nul
if errorlevel 1 (
    echo No se encontro proceso del Frontend en ejecucion
) else (
    echo [OK] Frontend detenido
)

echo.
echo Cerrando procesos de Node.js y Python relacionados...
taskkill /IM node.exe /F 2>nul
taskkill /IM python.exe /F 2>nul

echo.
echo ============================================
echo   Sistema Detenido
echo ============================================
echo.
pause


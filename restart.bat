@echo off
echo ============================================
echo   Reiniciando Sistema de Digiturno
echo ============================================
echo.

echo Deteniendo sistema...
call stop.bat

echo.
echo Esperando 2 segundos...
timeout /t 2 /nobreak > nul

echo.
echo Iniciando sistema nuevamente...
call start.bat


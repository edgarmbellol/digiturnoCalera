@echo off
echo ============================================
echo   Reiniciar Base de Datos Limpia
echo ============================================
echo.
echo ADVERTENCIA: Esto eliminara TODOS los turnos actuales
echo.
echo ¿Desea continuar? (S/N)
set /p respuesta="> "

if /i "%respuesta%" NEQ "S" (
    echo Operacion cancelada
    pause
    exit /b 0
)

echo.
echo [1/2] Deteniendo el sistema...
call stop.bat

echo.
echo [2/2] Eliminando base de datos antigua...
if exist "backend\digiturno.db" (
    del "backend\digiturno.db"
    echo [OK] Base de datos eliminada
) else (
    echo [INFO] No se encontro base de datos
)

echo.
echo ============================================
echo   Base de Datos Lista para Reiniciar
echo ============================================
echo.
echo Ahora ejecute: start.bat
echo La base de datos se creara automaticamente
echo.
pause


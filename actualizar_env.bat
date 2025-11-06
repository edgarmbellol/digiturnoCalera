@echo off
echo Actualizando archivo .env con driver SQL Server correcto...
echo.

cd backend

if exist ".env" (
    echo # Configuracion SQL Server (Solo lectura) > .env
    echo SQL_SERVER=192.168.1.26 >> .env
    echo SQL_DATABASE=CITISALUD >> .env
    echo SQL_USERNAME=con >> .env
    echo SQL_PASSWORD=Sopo2023* >> .env
    echo SQL_DRIVER=SQL Server >> .env
    echo. >> .env
    echo # Base de datos local >> .env
    echo SQLITE_DB_PATH=digiturno.db >> .env
    
    echo [OK] Archivo .env actualizado correctamente
) else (
    echo [INFO] No existe archivo .env, se usara la configuracion de config.py
)

cd ..
echo.
echo Configuracion actualizada. El sistema usara el driver: SQL Server
echo.
pause



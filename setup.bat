@echo off
echo ============================================
echo   Configuracion Inicial del Sistema
echo   Sistema de Digiturno
echo ============================================
echo.

echo [PASO 1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en el PATH
    echo Por favor instale Python 3.9 o superior desde https://www.python.org/
    pause
    exit /b 1
)
echo [OK] Python encontrado
echo.

echo [PASO 2/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH
    echo Por favor instale Node.js 18 o superior desde https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
echo.

echo [PASO 3/4] Configurando Backend...
cd backend

if not exist "venv\" (
    echo Creando entorno virtual de Python...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual
        pause
        exit /b 1
    )
)

echo Activando entorno virtual...
call venv\Scripts\activate

echo Instalando dependencias de Python...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias de Python
    pause
    exit /b 1
)

echo.
echo Verificando drivers ODBC...
python ..\verificar_odbc.py
echo.
echo Si no se encontro "ODBC Driver for SQL Server", consulte:
echo instalar_odbc_driver.md
echo.
pause

echo Creando archivo .env si no existe...
if not exist ".env" (
    copy .env.example .env
    echo [OK] Archivo .env creado
)

cd ..
echo [OK] Backend configurado correctamente
echo.

echo [PASO 4/4] Configurando Frontend...
cd frontend

echo Instalando dependencias de Node.js (esto puede tardar unos minutos)...
call npm install
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias de Node.js
    pause
    exit /b 1
)

echo Verificando logo...
if not exist "public\logo.png" (
    if exist "..\logo.png" (
        echo Copiando logo...
        copy ..\logo.png public\logo.png
    ) else (
        echo [ADVERTENCIA] No se encontro el archivo logo.png
    )
)

cd ..
echo [OK] Frontend configurado correctamente
echo.

echo ============================================
echo   Configuracion Completada Exitosamente!
echo ============================================
echo.
echo Para iniciar el sistema ejecute: start.bat
echo.
pause


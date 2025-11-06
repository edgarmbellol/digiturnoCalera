# Guía de Instalación - Sistema de Digiturno

## 📋 Requisitos del Sistema

### Software Necesario

1. **Python 3.9 o superior**
   - Descargar desde: https://www.python.org/downloads/
   - Durante la instalación, marcar "Add Python to PATH"

2. **Node.js 18 o superior**
   - Descargar desde: https://nodejs.org/
   - Incluye npm automáticamente

3. **ODBC Driver 17 for SQL Server**
   - Descargar desde: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   - Necesario para conectarse a SQL Server

### Hardware Recomendado

- **Servidor Backend**: 2GB RAM mínimo, 4GB recomendado
- **Kiosco (Tablet)**: Android/Windows tablet 10" o superior, orientación horizontal
- **Pantalla de Espera**: TV o monitor HD, navegador Chrome/Edge
- **Red**: Conexión estable al servidor SQL Server (192.168.1.26)

## 🔧 Instalación Paso a Paso

### 1. Preparar el Proyecto

```bash
# Clonar o descargar el proyecto
cd Digiturno
```

### 2. Configurar el Backend

```bash
# Navegar a la carpeta backend
cd backend

# Crear entorno virtual de Python
python -m venv venv

# Activar el entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de configuración
copy .env.example .env

# Editar .env si es necesario (las credenciales ya están configuradas)
```

**Verificar instalación del backend:**
```bash
python main.py
```

Debe iniciar en `http://localhost:8000` y mostrar:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Abrir en navegador: http://localhost:8000 - Debe mostrar mensaje del sistema

### 3. Configurar el Frontend

```bash
# Abrir nueva terminal
cd frontend

# Instalar dependencias (puede tardar unos minutos)
npm install

# Copiar el logo
# Copiar logo.png desde la raíz a frontend/public/
copy ..\logo.png public\logo.png

# Iniciar servidor de desarrollo
npm run dev
```

Debe iniciar en `http://localhost:3000`

### 4. Verificar Conexión a SQL Server

1. Abrir el navegador en `http://localhost:3000/kiosk`
2. Ingresar un número de cédula válido de la base de datos
3. Si encuentra el paciente, la conexión es exitosa

**Nota**: Si no conecta, verificar:
- Que el servidor SQL Server (192.168.1.26) sea accesible desde la red
- Que el ODBC Driver 17 esté instalado
- Que las credenciales en `.env` sean correctas

## 🖥️ Configuración de Dispositivos

### Kiosco (Tablet)

1. **Configurar tablet en orientación horizontal**
2. Abrir navegador (Chrome recomendado)
3. Ir a: `http://[IP-SERVIDOR]:3000/kiosk`
4. Activar modo kiosco/quiosco del navegador:
   - Chrome: Presionar F11 para pantalla completa
   - Android: Usar app "Kiosk Browser"
5. **Opcional**: Deshabilitar sleep/apagado automático

### Pantalla de Espera (TV)

1. Conectar PC/dispositivo a la TV
2. Abrir navegador en pantalla completa
3. Ir a: `http://[IP-SERVIDOR]:3000/display`
4. Verificar que el audio esté activado
5. Configurar para que inicie automáticamente al encender

### PC de Profesionales y Médicos

1. Abrir navegador
2. Crear accesos directos:
   - Profesionales: `http://[IP-SERVIDOR]:3000/professional/login`
   - Médicos: `http://[IP-SERVIDOR]:3000/doctor/login`

## 🚀 Puesta en Producción

### Opción 1: Servidor Windows

#### Backend
```bash
# Instalar como servicio Windows con NSSM
# Descargar NSSM: https://nssm.cc/download

# Instalar servicio
nssm install DigitrunoBackend "C:\ruta\a\python.exe" "C:\ruta\a\backend\main.py"
nssm set DigitrunoBackend AppDirectory "C:\ruta\a\backend"
nssm start DigitrunoBackend
```

#### Frontend
```bash
cd frontend

# Build de producción
npm run build

# Los archivos estarán en frontend/dist/
# Servir con IIS o cualquier servidor web
```

**Configurar IIS:**
1. Instalar IIS con soporte para aplicaciones
2. Crear nuevo sitio web apuntando a `frontend/dist/`
3. Configurar puerto 80 o 443 (HTTPS)
4. Agregar regla de reescritura para SPA

### Opción 2: Servidor Linux

```bash
# Backend con systemd
sudo nano /etc/systemd/system/digiturno-backend.service
```

Contenido del archivo:
```ini
[Unit]
Description=Digiturno Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/digiturno/backend
Environment="PATH=/var/www/digiturno/backend/venv/bin"
ExecStart=/var/www/digiturno/backend/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Activar servicio
sudo systemctl enable digiturno-backend
sudo systemctl start digiturno-backend

# Frontend con nginx
sudo apt install nginx
sudo nano /etc/nginx/sites-available/digiturno
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-servidor.com;
    
    root /var/www/digiturno/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/digiturno /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## 🔍 Pruebas del Sistema

### 1. Verificar Backend
```bash
curl http://localhost:8000/health
# Debe responder: {"status":"healthy"}
```

### 2. Probar Registro de Turno
1. Abrir kiosco: http://localhost:3000/kiosk
2. Ingresar cédula
3. Seleccionar servicio
4. Verificar que se genera el turno

### 3. Probar Pantalla de Espera
1. Abrir: http://localhost:3000/display
2. Desde el panel de profesionales, llamar un paciente
3. Verificar que aparece en la pantalla
4. Verificar anuncio por voz

### 4. Probar Login Profesionales
- Usuario de prueba: Consultar con admin SQL Server
- Verificar que los usuarios tengan '10' en el campo Aplicacion

## 🔒 Seguridad en Producción

1. **Cambiar contraseñas**: Actualizar credenciales en `.env`
2. **HTTPS**: Configurar certificado SSL
3. **Firewall**: Permitir solo puertos necesarios
4. **Backup**: Configurar respaldo automático de `digiturno.db`

## 📞 Solución de Problemas

### Error: "No se puede conectar a SQL Server"
- Verificar que el servidor esté accesible: `ping 192.168.1.26`
- Verificar credenciales en `.env`
- Verificar ODBC Driver instalado

### Error: "Module not found"
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### La pantalla de espera no habla
- Verificar que el navegador soporte Web Speech API (Chrome, Edge)
- Verificar que el audio no esté silenciado
- Probar en navegador diferente

### Turnos no aparecen
- Verificar que el backend esté corriendo
- Abrir consola del navegador (F12) y buscar errores
- Verificar que la URL del API sea correcta

## 📱 Contacto

Para soporte técnico, contactar al administrador del sistema.

---

**¡Instalación Completa!** El sistema está listo para usarse.


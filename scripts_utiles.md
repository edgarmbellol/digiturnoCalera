# Scripts Útiles - Sistema de Digiturno

## 🔧 Scripts de Desarrollo

### Iniciar Backend (Windows)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

### Iniciar Backend (Linux/Mac)
```bash
cd backend
source venv/bin/activate
python main.py
```

### Iniciar Frontend
```bash
cd frontend
npm run dev
```

### Iniciar Ambos (Desarrollo)

**Windows PowerShell:**
```powershell
# Terminal 1
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# Terminal 2 (nueva ventana)
cd frontend
npm run dev
```

**Linux/Mac:**
```bash
# Terminal 1
cd backend && source venv/bin/activate && python main.py

# Terminal 2
cd frontend && npm run dev
```

## 📦 Scripts de Construcción

### Build Frontend para Producción
```bash
cd frontend
npm run build
# Los archivos estarán en frontend/dist/
```

### Limpiar Build
```bash
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

## 🗄️ Scripts de Base de Datos

### Resetear Base de Datos Local (SQLite)
```bash
cd backend
rm digiturno.db
python main.py  # Se creará automáticamente
```

### Backup de Base de Datos
```bash
# Backup manual
copy backend\digiturno.db backend\backup\digiturno_backup_$(date +%Y%m%d).db

# En Linux/Mac
cp backend/digiturno.db backend/backup/digiturno_backup_$(date +%Y%m%d).db
```

### Verificar Conexión SQL Server
```python
# Ejecutar en Python
cd backend
python

>>> from database.sqlserver_db import get_sqlserver_connection
>>> conn = get_sqlserver_connection()
>>> if conn:
...     print("✓ Conexión exitosa")
... else:
...     print("✗ Error de conexión")
```

## 🧪 Scripts de Prueba

### Probar Endpoints del Backend
```bash
# Health check
curl http://localhost:8000/health

# Obtener servicios
curl http://localhost:8000/api/kiosk/servicios

# Registrar turno (ejemplo)
curl -X POST http://localhost:8000/api/kiosk/registro \
  -H "Content-Type: application/json" \
  -d '{"documento":"1234567890","servicio":"Facturación","condicion_especial":"Ninguna"}'
```

### Probar Frontend
```bash
# Linter
cd frontend
npm run lint

# Build test
npm run build
npm run preview
```

## 🚀 Scripts de Producción

### Crear Servicio Windows (Backend)

**Archivo: install_service.ps1**
```powershell
# Requiere NSSM (https://nssm.cc/)
$nssm = "C:\nssm\nssm.exe"
$python = "C:\ruta\a\Digiturno\backend\venv\Scripts\python.exe"
$script = "C:\ruta\a\Digiturno\backend\main.py"

& $nssm install DigitrunoBackend $python $script
& $nssm set DigitrunoBackend AppDirectory "C:\ruta\a\Digiturno\backend"
& $nssm set DigitrunoBackend Description "Sistema de Digiturno - Backend API"
& $nssm set DigitrunoBackend Start SERVICE_AUTO_START
& $nssm start DigitrunoBackend
```

### Crear Servicio Linux (Backend)

**Archivo: /etc/systemd/system/digiturno-backend.service**
```ini
[Unit]
Description=Digiturno Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/digiturno/backend
Environment="PATH=/var/www/digiturno/backend/venv/bin"
ExecStart=/var/www/digiturno/backend/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable digiturno-backend
sudo systemctl start digiturno-backend
sudo systemctl status digiturno-backend
```

### Deploy Frontend con Nginx

**Archivo: nginx.conf**
```nginx
server {
    listen 80;
    server_name digiturno.hospital.local;
    
    root /var/www/digiturno/frontend/dist;
    index index.html;
    
    # Logging
    access_log /var/log/nginx/digiturno-access.log;
    error_log /var/log/nginx/digiturno-error.log;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Scripts de Monitoreo

### Ver Logs del Backend (Windows)
```powershell
# Si está corriendo en terminal
# Los logs aparecen automáticamente

# Si está como servicio
Get-EventLog -LogName Application -Source "Digiturno*" -Newest 50
```

### Ver Logs del Backend (Linux)
```bash
# Como servicio
sudo journalctl -u digiturno-backend -f

# Últimas 100 líneas
sudo journalctl -u digiturno-backend -n 100
```

### Monitorear Uso de Base de Datos
```bash
# Tamaño de base de datos SQLite
cd backend
ls -lh digiturno.db

# En Windows
dir digiturno.db
```

### Ver Turnos Activos
```bash
# Conectar a SQLite
sqlite3 backend/digiturno.db

# Consultas útiles:
sqlite> SELECT COUNT(*) FROM turnos WHERE estado = 'espera';
sqlite> SELECT * FROM turnos WHERE DATE(fecha_registro) = DATE('now');
sqlite> SELECT servicio, COUNT(*) FROM turnos GROUP BY servicio;
sqlite> .exit
```

## 🔄 Scripts de Mantenimiento

### Limpiar Turnos Antiguos (más de 7 días)
```bash
cd backend
sqlite3 digiturno.db "DELETE FROM turnos WHERE fecha_registro < datetime('now', '-7 days')"
```

### Limpiar Llamados Antiguos
```bash
cd backend
sqlite3 digiturno.db "DELETE FROM llamados WHERE fecha_llamado < datetime('now', '-1 day')"
```

### Optimizar Base de Datos
```bash
cd backend
sqlite3 digiturno.db "VACUUM;"
```

### Script de Mantenimiento Automático (Linux Cron)
```bash
# Editar crontab
crontab -e

# Agregar: Limpiar turnos antiguos cada domingo a las 2 AM
0 2 * * 0 sqlite3 /var/www/digiturno/backend/digiturno.db "DELETE FROM turnos WHERE fecha_registro < datetime('now', '-7 days'); DELETE FROM llamados WHERE fecha_llamado < datetime('now', '-1 day'); VACUUM;"
```

## 🔐 Scripts de Seguridad

### Cambiar Contraseña de Base de Datos
1. Editar `backend/.env`
2. Cambiar valor de `SQL_PASSWORD`
3. Reiniciar backend

### Backup Automático (Linux)
```bash
#!/bin/bash
# backup_digiturno.sh

BACKUP_DIR="/backups/digiturno"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup SQLite
cp /var/www/digiturno/backend/digiturno.db $BACKUP_DIR/digiturno_$DATE.db

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "digiturno_*.db" -mtime +30 -delete

echo "Backup completado: digiturno_$DATE.db"
```

```bash
# Agregar a cron (cada día a las 3 AM)
0 3 * * * /path/to/backup_digiturno.sh
```

## 🆘 Scripts de Emergencia

### Reiniciar Todo (Windows)
```powershell
# Detener servicios
Stop-Service DigitrunoBackend

# Esperar 5 segundos
Start-Sleep -Seconds 5

# Reiniciar
Start-Service DigitrunoBackend

# Verificar
Get-Service DigitrunoBackend
```

### Reiniciar Todo (Linux)
```bash
#!/bin/bash
sudo systemctl restart digiturno-backend
sudo systemctl restart nginx
sudo systemctl status digiturno-backend
```

### Restaurar desde Backup
```bash
# Detener backend
sudo systemctl stop digiturno-backend

# Restaurar
cp /backups/digiturno/digiturno_20250101_030000.db /var/www/digiturno/backend/digiturno.db

# Reiniciar
sudo systemctl start digiturno-backend
```

## 📱 URLs Útiles

```
# Desarrollo
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs

# Pantallas
Home: http://localhost:3000/
Kiosco: http://localhost:3000/kiosk
Pantalla Espera: http://localhost:3000/display
Login Profesionales: http://localhost:3000/professional/login
Login Médicos: http://localhost:3000/doctor/login
```

## 🎯 Comandos Rápidos

```bash
# Ver estado completo del sistema
curl http://localhost:8000/api/display/estadisticas

# Ver turnos en espera
curl http://localhost:8000/api/display/turnos-en-espera

# Salud del backend
curl http://localhost:8000/health
```

---

**Nota**: Reemplaza las rutas y configuraciones según tu instalación específica.


# Instalación de ODBC Driver for SQL Server

## 🔍 Problema

Si ves este error:
```
Error conectando a SQL Server: ('IM002', '[IM002] [Microsoft][Administrador de controladores ODBC] 
No se encuentra el nombre del origen de datos y no se especificó ningún controlador predeterminado')
```

Significa que **no tienes instalado el driver ODBC para SQL Server**.

---

## ✅ Solución

### Opción 1: Verificar Drivers Instalados (Recomendado)

Primero, verifica qué drivers tienes:

```bash
cd backend
venv\Scripts\activate
python ..\verificar_odbc.py
```

Este script te mostrará:
- Todos los drivers ODBC disponibles
- Cuál es el recomendado para usar
- Cómo actualizar la configuración

### Opción 2: Instalar ODBC Driver 18 (Más Reciente)

1. **Descargar el instalador:**
   - Ir a: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   - O descargar directo: https://go.microsoft.com/fwlink/?linkid=2223304

2. **Ejecutar el instalador:**
   - Hacer doble clic en `msodbcsql.msi`
   - Aceptar los términos de licencia
   - Instalar con configuración predeterminada

3. **Verificar la instalación:**
   ```bash
   python verificar_odbc.py
   ```

### Opción 3: Instalar ODBC Driver 17 (Versión Anterior Estable)

1. **Descargar:**
   - https://www.microsoft.com/en-us/download/details.aspx?id=56567
   - Seleccionar idioma: Spanish
   - Descargar: `msodbcsql_17_[version]_x64.msi`

2. **Instalar** siguiendo el asistente

---

## 🔧 Después de Instalar

### El sistema detectará automáticamente el driver

El sistema ahora **detecta automáticamente** el driver instalado, así que después de instalarlo:

1. **Reiniciar el backend:**
   ```bash
   stop.bat
   start.bat
   ```

2. El sistema mostrará:
   ```
   ✅ Usando driver detectado: 'ODBC Driver 18 for SQL Server'
   ```

### Actualización Manual (Opcional)

Si prefieres especificar el driver manualmente, edita `backend/config.py`:

```python
SQL_DRIVER: str = "ODBC Driver 18 for SQL Server"  # O el que instalaste
```

O edita `backend/.env`:

```env
SQL_DRIVER=ODBC Driver 18 for SQL Server
```

---

## 🧪 Probar la Conexión

Después de instalar el driver:

```bash
cd backend
venv\Scripts\activate
python
```

```python
>>> from database.sqlserver_db import get_sqlserver_connection
>>> conn = get_sqlserver_connection()
✅ Usando driver detectado: 'ODBC Driver 18 for SQL Server'
>>> if conn:
...     print("✅ Conexión exitosa!")
... else:
...     print("❌ Error de conexión")
```

---

## 📋 Drivers Comunes y Compatibilidad

| Driver | Windows | Linux | Recomendado |
|--------|---------|-------|-------------|
| ODBC Driver 18 for SQL Server | ✅ | ✅ | ⭐⭐⭐ Más reciente |
| ODBC Driver 17 for SQL Server | ✅ | ✅ | ⭐⭐ Estable |
| ODBC Driver 13 for SQL Server | ✅ | ✅ | ⭐ Antiguo |
| SQL Server Native Client 11.0 | ✅ | ❌ | ⚠️ Deprecated |
| SQL Server | ✅ | ❌ | ⚠️ Muy antiguo |

---

## 🆘 Si Sigue Sin Funcionar

### 1. Verificar que SQL Server sea accesible

```bash
ping 192.168.1.26
```

Debe responder. Si no:
- Verifica que estés en la misma red
- Verifica firewall
- Verifica que el servidor SQL esté encendido

### 2. Verificar credenciales

En `backend/.env`:
```env
SQL_SERVER=192.168.1.26
SQL_DATABASE=CITISALUD
SQL_USERNAME=con
SQL_PASSWORD=Sopo2023*
```

### 3. Probar conexión sin SSL (ODBC Driver 18)

Si usas ODBC Driver 18 y sigue fallando, puede ser problema de certificados SSL.

Edita `backend/database/sqlserver_db.py` y agrega a la connection string:

```python
connection_string = (
    f"DRIVER={{{driver}}};"
    f"SERVER={settings.SQL_SERVER};"
    f"DATABASE={settings.SQL_DATABASE};"
    f"UID={settings.SQL_USERNAME};"
    f"PWD={settings.SQL_PASSWORD};"
    "ApplicationIntent=ReadOnly;"
    "Connection Timeout=5;"
    "TrustServerCertificate=yes;"  # ← Agregar esta línea
)
```

### 4. Usar modo de compatibilidad

Si tienes SQL Server antiguo, puede que necesites usar un driver antiguo:

```env
SQL_DRIVER=SQL Server Native Client 11.0
```

O incluso:
```env
SQL_DRIVER=SQL Server
```

---

## 📞 Script de Diagnóstico Completo

Ejecutar:
```bash
python verificar_odbc.py
```

Te mostrará:
- ✅ Drivers instalados
- ✅ Driver recomendado
- ✅ Configuración a usar

---

## 🎯 Resumen Rápido

```bash
# 1. Descargar e instalar ODBC Driver 18
https://go.microsoft.com/fwlink/?linkid=2223304

# 2. Verificar instalación
python verificar_odbc.py

# 3. Reiniciar sistema
restart.bat

# ¡Listo!
```

---

## ✅ Verificación Final

Después de instalar, deberías ver en el log del backend:

```
✅ Usando driver detectado: 'ODBC Driver 18 for SQL Server'
✓ Base de datos SQLite inicializada correctamente
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Y al registrar un turno en el kiosco, no debería aparecer ningún error de conexión.

---

**Nota**: Si estás en producción y no puedes instalar software, contacta al administrador del sistema para que instale el ODBC Driver.


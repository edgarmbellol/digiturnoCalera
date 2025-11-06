# 🚀 Inicio Rápido - Sistema de Digiturno

## Windows - Instalación en 2 Pasos

### 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Python 3.9 o superior**  
   Descargar: https://www.python.org/downloads/  
   ⚠️ Durante la instalación, marca "Add Python to PATH"

2. **Node.js 18 o superior**  
   Descargar: https://nodejs.org/

3. **ODBC Driver 17 for SQL Server**  
   Descargar: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

---

## 🎯 Instalación y Ejecución

### Paso 1: Configuración Inicial (Solo la primera vez)

Haz doble clic en:
```
setup.bat
```

Este script:
- ✅ Verifica Python y Node.js
- ✅ Crea el entorno virtual de Python
- ✅ Instala las dependencias del backend
- ✅ Instala las dependencias del frontend
- ✅ Configura el archivo .env
- ✅ Copia el logo del hospital

**Tiempo estimado:** 3-5 minutos (dependiendo de la velocidad de internet)

---

### Paso 2: Iniciar el Sistema

Haz doble clic en:
```
start.bat
```

Este script:
- ✅ Inicia el backend (FastAPI) en una ventana
- ✅ Inicia el frontend (React) en otra ventana
- ✅ Abre automáticamente el navegador en http://localhost:3000

**¡El sistema ya está funcionando!** 🎉

---

## 🎮 Controles del Sistema

### Iniciar
```
start.bat
```
Ejecuta el backend y frontend simultáneamente.

### Detener
```
stop.bat
```
Detiene todos los procesos del sistema.

### Reiniciar
```
restart.bat
```
Reinicia el sistema completo (útil después de hacer cambios).

---

## 🌐 URLs del Sistema

Una vez iniciado, puedes acceder a:

| Módulo | URL | Descripción |
|--------|-----|-------------|
| **Inicio** | http://localhost:3000 | Página principal con todos los módulos |
| **Kiosco** | http://localhost:3000/kiosk | Registro de turnos (para tablet) |
| **Pantalla Espera** | http://localhost:3000/display | Visualización de llamados (para TV) |
| **Profesionales** | http://localhost:3000/professional/login | Panel de facturación, Famisanar, Nueva EPS |
| **Médicos** | http://localhost:3000/doctor/login | Panel de agenda médica |
| **API Docs** | http://localhost:8000/docs | Documentación automática de la API |

---

## 🎬 Primera Vez Usando el Sistema

### 1. Probar el Kiosco
1. Abrir: http://localhost:3000/kiosk
2. Ingresar un número de cédula (debe existir en la base de datos CITISALUD)
3. Seleccionar un servicio
4. Seleccionar condición especial
5. ¡Se generará el turno!

### 2. Ver la Pantalla de Espera
1. Abrir en otra pestaña: http://localhost:3000/display
2. Dejar esta pantalla abierta (simula la TV del hospital)

### 3. Probar el Panel de Profesionales
1. Abrir: http://localhost:3000/professional/login
2. Ingresar usuario y contraseña (deben existir en tabla Usuarios de CITISALUD)
3. El campo "Aplicacion" del usuario debe contener "10"
4. Seleccionar servicio y ventanilla
5. Llamar a un paciente
6. Verás el llamado en la pantalla de espera y escucharás el anuncio

---

## ❓ Problemas Comunes

### "Python no se reconoce como comando"
- Reinstala Python y marca "Add Python to PATH"
- O agrega manualmente Python al PATH de Windows

### "Node no se reconoce como comando"
- Reinstala Node.js
- Reinicia la computadora después de instalar

### "No se puede conectar a SQL Server"
- Verifica que el servidor 192.168.1.26 sea accesible
- Verifica las credenciales en `backend/.env`
- Verifica que ODBC Driver 17 esté instalado

### El navegador no se abre automáticamente
- Abre manualmente: http://localhost:3000

### Las ventanas del backend/frontend se cierran inmediatamente
- Ejecuta primero `setup.bat`
- Verifica que no haya errores en la instalación

---

## 📱 Configuración de Dispositivos

### Para Kiosco (Tablet)
1. Conectar tablet a la misma red
2. Obtener IP del servidor: `ipconfig` (ejemplo: 192.168.1.100)
3. Abrir en tablet: `http://192.168.1.100:3000/kiosk`
4. Activar modo pantalla completa (F11)

### Para Pantalla de Espera (TV)
1. Conectar PC/dispositivo a la TV
2. Abrir: `http://localhost:3000/display`
3. Presionar F11 para pantalla completa
4. Verificar que el audio esté activado

---

## 🔄 Actualizar el Sistema

Si se realizan cambios en el código:

1. Detener el sistema:
```
stop.bat
```

2. Reiniciar:
```
start.bat
```

---

## 💾 Backup de Datos

La base de datos local está en:
```
backend/digiturno.db
```

Para hacer un backup:
```
copy backend\digiturno.db backup\digiturno_backup.db
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa el archivo INSTALACION.md para más detalles
2. Consulta MANUAL_USUARIO.md para guía de uso
3. Revisa la documentación técnica en ARQUITECTURA_TECNICA.md

---

## ✅ Lista de Verificación

Antes de usar en producción:

- [ ] Python y Node.js instalados correctamente
- [ ] ODBC Driver 17 instalado
- [ ] Ejecutado `setup.bat` exitosamente
- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Conexión a SQL Server funciona (192.168.1.26)
- [ ] Logo del hospital se muestra correctamente
- [ ] Text-to-Speech funciona en la pantalla de espera
- [ ] Los usuarios pueden hacer login
- [ ] Se pueden registrar turnos

---

**¡Listo para usar!** 🎉

Sistema desarrollado para el **Hospital Divino Salvador de Sopó**


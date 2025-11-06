# Sistema de Digiturno - Hospital Divino Salvador de Sopó

Sistema completo de gestión de turnos para el Hospital Divino Salvador de Sopó, desarrollado con FastAPI (Backend) y React + TypeScript (Frontend).

## 🏥 Características

### 1. **Kiosco de Registro**
- Optimizado para tablets en orientación horizontal
- Registro de pacientes con validación en base de datos SQL Server
- Selección de servicios (Citas Médicas, Facturación, Famisanar, Nueva EPS)
- Priorización de condiciones especiales (Discapacitados, Tercera Edad, Embarazo)

### 2. **Pantalla de Espera**
- Visualización en tiempo real de llamados
- Anuncios por voz usando Text-to-Speech
- Diseñada para pantallas de televisor
- Actualización automática cada 3 segundos

### 3. **Panel de Profesionales**
- Login seguro con validación contra SQL Server
- Gestión de turnos por servicio
- Sistema de llamado de pacientes
- Gestión de rellamados para pacientes que no responden
- Registro de observaciones

### 4. **Panel de Médicos**
- Vista de agenda diaria desde SQL Server
- Filtro por fecha y búsqueda por nombre/documento
- Indicador de pacientes facturados y en espera
- Gestión completa de consultas médicas

## 🚀 Tecnologías

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLite** - Base de datos local para gestión de turnos
- **SQL Server** - Conexión de solo lectura a base de datos hospitalaria
- **Pydantic** - Validación de datos
- **pyodbc** - Conexión a SQL Server

### Frontend
- **React 18** - Biblioteca de interfaces de usuario
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **TailwindCSS** - Framework de estilos
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos modernos
- **date-fns** - Manejo de fechas

## 📦 Instalación

### Requisitos Previos
- Python 3.9 o superior
- Node.js 18 o superior
- ODBC Driver 17 for SQL Server
- Acceso a la red donde se encuentra el servidor SQL Server

### Instalación Rápida (Windows)

**Opción 1: Instalación y Ejecución Automática**

1. Ejecutar el script de configuración (solo la primera vez):
```bash
setup.bat
```

2. Iniciar el sistema:
```bash
start.bat
```

¡Listo! El sistema se abrirá automáticamente en el navegador.

**Scripts disponibles:**
- `setup.bat` - Configuración inicial (solo primera vez)
- `start.bat` - Iniciar el sistema completo
- `stop.bat` - Detener el sistema
- `restart.bat` - Reiniciar el sistema

### Instalación Manual

#### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python main.py
```

El backend estará disponible en `http://localhost:8000`

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## ⚙️ Configuración

### Variables de Entorno (Backend)

Crear un archivo `.env` en la carpeta `backend/` basado en `.env.example`:

```env
SQL_SERVER=192.168.1.26
SQL_DATABASE=CITISALUD
SQL_USERNAME=con
SQL_PASSWORD=Sopo2023*
SQL_DRIVER=ODBC Driver 17 for SQL Server
SQLITE_DB_PATH=digiturno.db
```

### Configuración Frontend

Si es necesario cambiar la URL del backend, crear archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api
```

## 🗄️ Estructura del Proyecto

```
Digiturno/
├── backend/
│   ├── main.py                 # Punto de entrada de la aplicación
│   ├── config.py               # Configuración general
│   ├── requirements.txt        # Dependencias Python
│   ├── database/
│   │   ├── sqlite_db.py       # Gestión de SQLite
│   │   └── sqlserver_db.py    # Conexión a SQL Server
│   ├── models/
│   │   └── schemas.py         # Modelos Pydantic
│   └── routers/
│       ├── kiosk_routes.py    # Endpoints del kiosco
│       ├── professional_routes.py  # Endpoints profesionales
│       ├── doctor_routes.py   # Endpoints médicos
│       └── display_routes.py  # Endpoints pantalla de espera
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Componente principal
│   │   ├── main.tsx           # Punto de entrada
│   │   ├── services/
│   │   │   └── api.ts         # Servicios API
│   │   └── screens/
│   │       ├── HomeScreen.tsx
│   │       ├── KioskScreen.tsx
│   │       ├── DisplayScreen.tsx
│   │       ├── ProfessionalLogin.tsx
│   │       ├── ProfessionalPanel.tsx
│   │       ├── DoctorLogin.tsx
│   │       └── DoctorPanel.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── logo.png                    # Logo del hospital
└── README.md
```

## 🎨 Diseño

El sistema utiliza los colores institucionales del Hospital Divino Salvador de Sopó:

- **Azul Cyan** (`#0ea5e9`) - Color principal
- **Verde Vibrante** (`#10b981`) - Color secundario
- **Blanco** - Texto y fondos
- **Tonos oscuros** - Contraste y legibilidad

## 🔒 Seguridad

- **SQL Server**: Conexión configurada como ReadOnly para evitar modificaciones accidentales
- **Consultas optimizadas**: Uso de `WITH (NOLOCK)` para no bloquear la base de datos
- **Validación de usuarios**: Desencriptación de contraseñas según especificación (restar 2 caracteres ASCII)
- **Sesiones**: Gestión local de sesiones con localStorage

## 📱 Módulos del Sistema

### 1. Kiosco (`/kiosk`)
- **Optimizado para tablet horizontal** - Layout diseñado específicamente para 1024x768+ sin scroll
- **Teclado numérico en pantalla** - Botones grandes (80x80px) que no usan el teclado del sistema
- **Layout de 2 columnas** - Aprovecha el espacio horizontal (título/display a la izquierda, teclado a la derecha)
- **Mensaje de bienvenida personalizado** - Busca y muestra el nombre del paciente desde SQL Server
- Flujo de 3 pasos intuitivo
- Confirmación visual del turno
- Botones de Limpiar y Borrar para corrección fácil
- Todo visible en una sola pantalla (no requiere scroll)

### 2. Pantalla de Espera (`/display`)
- Diseño para pantalla completa
- Anuncios por voz automáticos
- Actualización en tiempo real
- Historial de llamados recientes

### 3. Panel Profesionales (`/professional/login` y `/professional/panel`)
- Login con selección de servicio y ventanilla
- Vista de turnos en espera priorizados
- Sistema de rellamados
- Registro de observaciones

### 4. Panel Médicos (`/doctor/login` y `/doctor/panel`)
- Login con selección de consultorio
- Vista de agenda desde SQL Server
- Filtros por fecha y búsqueda
- Indicadores de estado de pacientes
- Gestión de citas facturadas

## 🔧 Endpoints API

### Kiosco
- `POST /api/kiosk/registro` - Registrar nuevo turno
- `GET /api/kiosk/servicios` - Obtener servicios disponibles
- `GET /api/kiosk/condiciones` - Obtener condiciones especiales

### Profesionales
- `POST /api/professional/login` - Login de profesional
- `GET /api/professional/turnos/{servicio}` - Obtener turnos en espera
- `POST /api/professional/llamar` - Llamar paciente
- `POST /api/professional/atender` - Atender paciente
- `GET /api/professional/rellamados/{servicio}` - Obtener rellamados
- `POST /api/professional/logout/{sesion_id}` - Cerrar sesión

### Médicos
- `POST /api/doctor/login` - Login de médico
- `GET /api/doctor/agenda/{codigo_profesional}` - Obtener agenda
- `POST /api/doctor/marcar-facturado` - Marcar cita como facturada
- `POST /api/doctor/llamar-paciente` - Llamar paciente de la agenda
- `POST /api/doctor/atender` - Atender paciente
- `POST /api/doctor/logout/{sesion_id}` - Cerrar sesión

### Pantalla de Espera
- `GET /api/display/llamados-recientes` - Obtener últimos llamados
- `GET /api/display/ultimo-llamado` - Obtener último llamado para anunciar
- `GET /api/display/turnos-en-espera` - Obtener turnos en espera
- `GET /api/display/estadisticas` - Obtener estadísticas del día

## 🚦 Producción

### Backend

```bash
# Instalar gunicorn
pip install gunicorn

# Ejecutar con gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

```bash
# Build para producción
npm run build

# Los archivos estáticos estarán en frontend/dist/
# Servir con nginx, apache, o cualquier servidor web
```

## 📝 Notas Importantes

1. **Optimización SQL Server**: Todas las consultas usan `WITH (NOLOCK)` y `ApplicationIntent=ReadOnly`
2. **Base de datos local**: SQLite se usa solo para gestión de turnos y sesiones
3. **Actualización automática**: Los paneles se actualizan automáticamente sin necesidad de refresh
4. **Text-to-Speech**: Funciona en navegadores modernos que soporten Web Speech API
   - ✅ **Edge**: Funciona automáticamente (RECOMENDADO para pantalla de espera)
   - ⚠️ **Chrome**: Requiere 1 clic al inicio para activar voz (ver `SOLUCION_CHROME.md`)
   - ⚠️ **Firefox/Safari**: Soporte limitado (no recomendados)
5. **Diferenciación Consultorio/Ventanilla**: El sistema diferencia automáticamente entre llamados médicos (consultorio) y de servicio (ventanilla)
6. **Llamados Simultáneos**: Soporta hasta 3 llamados simultáneos con cola de anuncios de voz (ver `MEJORAS_LLAMADOS_SIMULTANEOS.md`)
7. **Diseño Moderno del Kiosco**: Header con efecto de vidrio, indicadores de pasos con iconos, animaciones y gradientes (ver `MEJORA_DISENO_HEADER_KIOSCO.md`)
8. **Logos Destacados**: Todos los logos tienen fondo blanco o con gradiente para destacar sobre cualquier color de fondo (ver `MEJORA_LOGOS_DESTACADOS.md`)
9. **Logo**: Coloca el archivo `logo.png` en `frontend/public/` para mostrarlo en todas las pantallas

## 🆘 Soporte

Para problemas o preguntas sobre el sistema, contactar al equipo de desarrollo.

## 📄 Licencia

Sistema desarrollado exclusivamente para el Hospital Divino Salvador de Sopó.

---

Desarrollado con ❤️ para el Hospital Divino Salvador de Sopó


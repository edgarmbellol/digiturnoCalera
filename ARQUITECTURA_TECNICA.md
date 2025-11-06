# Arquitectura Técnica - Sistema de Digiturno

## 📐 Visión General

Sistema distribuido de gestión de turnos con arquitectura cliente-servidor:
- **Backend**: API REST con FastAPI (Python)
- **Frontend**: SPA con React + TypeScript
- **Bases de Datos**: SQLite (local) + SQL Server (hospitalaria, solo lectura)

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Kiosco   │  │ Display  │  │Professional│  │ Doctor  │   │
│  │ Screen   │  │ Screen   │  │  Panel    │  │  Panel  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │              │          │
│       └─────────────┴──────────────┴──────────────┘         │
│                          │                                   │
│                    React Router                              │
│                          │                                   │
│                    Axios (HTTP Client)                       │
└──────────────────────────┼──────────────────────────────────┘
                           │
                     HTTP/REST API
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    Backend Layer                             │
├──────────────────────────┼──────────────────────────────────┤
│                      FastAPI                                 │
│                          │                                   │
│  ┌───────────────────────┼──────────────────────────────┐   │
│  │               API Routes                             │   │
│  ├──────────┬──────────┬──────────┬──────────┐         │   │
│  │ Kiosk   │Professional│ Doctor  │ Display  │         │   │
│  │ Routes  │  Routes   │ Routes  │ Routes   │         │   │
│  └────┬────┴─────┬─────┴────┬────┴─────┬────┘         │   │
│       │          │          │          │              │   │
│  ┌────┴──────────┴──────────┴──────────┴────┐         │   │
│  │         Pydantic Schemas                  │         │   │
│  └───────────────────┬───────────────────────┘         │   │
│                      │                                 │   │
│  ┌───────────────────┴───────────────────────┐         │   │
│  │         Database Layer                    │         │   │
│  ├──────────────────┬────────────────────────┤         │   │
│  │  SQLite Manager  │  SQL Server Connector  │         │   │
│  └────────┬─────────┴──────────┬─────────────┘         │   │
└───────────┼────────────────────┼───────────────────────┘   │
            │                    │                            
            │                    │                            
┌───────────┼────────────────────┼───────────────────────────┐
│      Data Layer                                             │
├───────────┼────────────────────┼───────────────────────────┤
│  ┌────────▼─────────┐  ┌───────▼──────────┐               │
│  │  SQLite Local    │  │  SQL Server      │               │
│  │  digiturno.db    │  │  CITISALUD       │               │
│  │                  │  │  (Read-Only)     │               │
│  │ • turnos         │  │ • Pacientes      │               │
│  │ • llamados       │  │ • Usuarios       │               │
│  │ • sesiones       │  │ • Citas          │               │
│  │ • citas_fact.    │  │                  │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Stack Tecnológico Detallado

### Backend (Python 3.9+)

#### Framework Principal
- **FastAPI 0.104.1**: Framework web asíncrono moderno
  - Auto-documentación con Swagger UI
  - Validación automática con Pydantic
  - Alto rendimiento (basado en Starlette y Uvicorn)

#### Servidor ASGI
- **Uvicorn 0.24.0**: Servidor ASGI de alto rendimiento
  - Soporte para WebSockets
  - Hot reload en desarrollo

#### Validación y Configuración
- **Pydantic 2.5.0**: Validación de datos con type hints
- **pydantic-settings 2.1.0**: Gestión de configuración con variables de entorno

#### Base de Datos
- **sqlite3** (built-in): Base de datos local para turnos
- **pyodbc 5.0.1**: Conector ODBC para SQL Server
  - ApplicationIntent=ReadOnly
  - WITH (NOLOCK) en queries

#### Utilidades
- **python-dotenv 1.0.0**: Carga de variables de entorno

### Frontend (Node.js 18+)

#### Framework y Librería Principal
- **React 18.2.0**: Biblioteca UI con hooks
- **React DOM 18.2.0**: Renderizado web
- **TypeScript 5.2.2**: Tipado estático

#### Build Tool
- **Vite 5.0.8**: Build tool de nueva generación
  - HMR (Hot Module Replacement) ultra-rápido
  - Optimización automática de chunks
  - Pre-bundling de dependencias

#### Enrutamiento
- **React Router DOM 6.20.0**: Navegación SPA
  - Lazy loading de rutas
  - Navegación programática

#### Estilos
- **TailwindCSS 3.3.6**: Framework CSS utility-first
  - JIT (Just-In-Time) compiler
  - PurgeCSS integrado
  - Custom theme con colores del hospital

#### HTTP Client
- **Axios 1.6.2**: Cliente HTTP con interceptores
  - Manejo automático de errores
  - Transformación de datos

#### Iconos
- **Lucide React 0.294.0**: Iconos SVG modernos y ligeros

#### Utilidades
- **date-fns 2.30.0**: Manipulación y formato de fechas
  - Localización en español
  - Tree-shakeable

## 💾 Modelo de Datos

### Base de Datos Local (SQLite)

#### Tabla: `turnos`
```sql
CREATE TABLE turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_turno TEXT NOT NULL,           -- Ej: CM-0001
    documento TEXT NOT NULL,
    nombre_paciente TEXT NOT NULL,
    servicio TEXT NOT NULL,               -- Citas Médicas, Facturación, etc.
    condicion_especial TEXT,              -- Discapacitado, Tercera Edad, etc.
    ventanilla INTEGER,
    estado TEXT DEFAULT 'espera',         -- espera, llamado, atendido, no_responde
    profesional_codigo TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_llamado TIMESTAMP,
    fecha_atencion TIMESTAMP,
    observacion TEXT,
    rellamado INTEGER DEFAULT 0
);
```

#### Tabla: `llamados`
```sql
CREATE TABLE llamados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id INTEGER NOT NULL,
    numero_turno TEXT NOT NULL,
    nombre_paciente TEXT NOT NULL,
    servicio TEXT NOT NULL,
    ventanilla INTEGER NOT NULL,
    fecha_llamado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mostrado INTEGER DEFAULT 0,           -- Para controlar anuncios
    FOREIGN KEY (turno_id) REFERENCES turnos (id)
);
```

#### Tabla: `sesiones_profesionales`
```sql
CREATE TABLE sesiones_profesionales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_usuario TEXT NOT NULL,
    nombre_usuario TEXT NOT NULL,
    servicio TEXT NOT NULL,
    ventanilla INTEGER NOT NULL,
    fecha_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_logout TIMESTAMP,
    activo INTEGER DEFAULT 1
);
```

#### Tabla: `citas_facturadas`
```sql
CREATE TABLE citas_facturadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    secuencia_cita INTEGER NOT NULL UNIQUE,
    documento TEXT NOT NULL,
    fecha_facturacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    en_espera INTEGER DEFAULT 1
);
```

### Base de Datos Hospitalaria (SQL Server - Solo Lectura)

#### Tabla: `Pacientes`
```sql
-- Campos utilizados:
- Documento      -- Número de identificación
- Nombre1        -- Primer nombre
- Nombre2        -- Segundo nombre (opcional)
- Apellido1      -- Primer apellido
- Apellido2      -- Segundo apellido (opcional)
```

#### Tabla: `Usuarios`
```sql
-- Campos utilizados:
- CodUsuario     -- Código de usuario
- Clave          -- Contraseña encriptada (cada char + 2 ASCII)
- Aplicacion     -- Debe contener '10'
```

#### Tabla: `Citas`
```sql
-- Campos utilizados:
- Secuencia      -- ID único de la cita
- Fecha          -- Fecha de la cita (YYYY-MM-DD HH:MM:SS)
- Hora           -- Hora de la cita
- Prof           -- Código del profesional
- Documento      -- Documento del paciente
- Indicador      -- Estado: 0=Abierta, 1=Cerrada
```

## 🔐 Seguridad

### Backend

1. **SQL Injection Prevention**
   - Uso de consultas parametrizadas
   - Validación con Pydantic

2. **Conexión SQL Server**
   - `ApplicationIntent=ReadOnly`
   - `WITH (NOLOCK)` en todas las queries
   - Connection timeout de 5 segundos

3. **Validación de Entrada**
   - Pydantic schemas en todos los endpoints
   - Type hints estrictos

### Frontend

1. **Autenticación**
   - Sesiones en localStorage
   - Validación en cada request

2. **XSS Prevention**
   - React escapa automáticamente
   - No uso de `dangerouslySetInnerHTML`

3. **CORS**
   - Configurado en backend
   - En producción: restringir orígenes

## ⚡ Optimizaciones

### Backend

1. **Consultas Optimizadas**
   - Índices en columnas frecuentes
   - `WITH (NOLOCK)` para lectura
   - Límite en resultados

2. **Async/Await**
   - Operaciones I/O asíncronas
   - No bloqueo del event loop

3. **Cache**
   - Respuestas frecuentes en memoria
   - TTL configurable

### Frontend

1. **Code Splitting**
   - Lazy loading de rutas
   - Dynamic imports

2. **Optimización de Assets**
   - Compresión de imágenes
   - Minificación automática (Vite)

3. **React Performance**
   - `useState` y `useEffect` optimizados
   - Evitar re-renders innecesarios

### Base de Datos

1. **Índices SQLite**
```sql
CREATE INDEX idx_turnos_estado ON turnos(estado);
CREATE INDEX idx_turnos_servicio ON turnos(servicio);
CREATE INDEX idx_llamados_mostrado ON llamados(mostrado);
CREATE INDEX idx_citas_facturadas_secuencia ON citas_facturadas(secuencia_cita);
```

2. **Limpieza Automática**
   - Borrado de turnos antiguos
   - VACUUM periódico

## 📡 API REST

### Convenciones

- **Base URL**: `/api`
- **Formato**: JSON
- **Códigos HTTP**:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 404: Not Found
  - 500: Server Error

### Rate Limiting
- No implementado (desarrollo)
- Recomendado en producción: 100 req/min por IP

## 🎨 Frontend - Patrones de Diseño

### Estructura de Componentes
```
src/
├── screens/          # Páginas principales
│   ├── HomeScreen
│   ├── KioskScreen
│   ├── DisplayScreen
│   ├── ProfessionalLogin
│   ├── ProfessionalPanel
│   ├── DoctorLogin
│   └── DoctorPanel
├── services/         # Servicios API
│   └── api.ts
└── main.tsx         # Entry point
```

### State Management
- **useState**: Estado local de componentes
- **useEffect**: Side effects y polling
- **localStorage**: Persistencia de sesiones

### Polling Strategy
```javascript
// Display: cada 3 segundos
// Panels: cada 5 segundos
// Agenda: cada 10 segundos
```

## 🔄 Flujo de Datos

### 1. Registro de Turno
```
Kiosco → POST /api/kiosk/registro
       → Buscar paciente en SQL Server
       → Generar número de turno
       → Guardar en SQLite
       → Retornar turno
```

### 2. Llamar Paciente
```
Panel → POST /api/professional/llamar
      → Actualizar turno en SQLite
      → Crear registro en llamados
      → Display polling detecta nuevo llamado
      → Text-to-Speech anuncia
```

### 3. Agenda Médica
```
Panel Médico → GET /api/doctor/agenda/{codigo}?fecha=YYYY-MM-DD
             → Consultar SQL Server (Citas)
             → Join con Pacientes
             → Verificar en citas_facturadas (SQLite)
             → Retornar con estados
```

## 📊 Monitoreo y Logs

### Backend
- Uvicorn access logs
- Python logging module
- Errores en stderr

### Frontend
- Console.log para debugging
- Error boundaries (recomendado)

### Métricas Recomendadas
- Turnos por día
- Tiempo promedio de espera
- Tasa de no respuesta
- Citas atendidas vs programadas

## 🚀 Deployment

### Desarrollo
- Backend: Uvicorn con reload
- Frontend: Vite dev server

### Producción
- Backend: Gunicorn + Uvicorn workers
- Frontend: Build estático + Nginx
- HTTPS obligatorio
- PM2 para gestión de procesos (alternativa)

## 🔧 Configuración Avanzada

### Backend - Gunicorn Config
```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
```

### Nginx - Frontend + Proxy
```nginx
# Compresión
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Headers de seguridad
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## 📱 Soporte de Navegadores

### Requerido
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Text-to-Speech
- Chrome/Edge (mejor soporte)
- Firefox (soporte básico)
- Safari (soporte limitado)

## 🧪 Testing (Recomendado)

### Backend
- pytest para unit tests
- pytest-asyncio para tests async
- Coverage mínimo: 70%

### Frontend
- Jest + React Testing Library
- Cypress para E2E
- Coverage mínimo: 60%

---

**Versión 1.0** - Documentación Técnica Completa


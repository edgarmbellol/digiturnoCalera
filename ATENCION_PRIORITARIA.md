# Sistema de Atención Prioritaria

## 📋 Descripción

El sistema Digiturno ahora incluye un **sistema de atención prioritaria** para pacientes con discapacidad, garantizando que reciban atención antes que otros pacientes en espera.

## ✨ Características Principales

### 1. **Pregunta Explícita en el Kiosco**
- Después de ingresar el documento, el sistema pregunta: **"¿Tiene alguna discapacidad?"**
- Dos grandes botones claramente visibles:
  - **SÍ, tengo discapacidad** (♿)
  - **NO tengo discapacidad** (👤)
- Mensaje claro: "Los pacientes con discapacidad tendrán atención prioritaria"

### 2. **Indicador Visual Prominente**
Cuando un paciente es marcado como prioritario:
- ✅ Aparece **PRIMERO** en la lista de turnos
- ✅ Tarjeta destacada con **borde morado** y fondo degradado
- ✅ Badge **"♿ PRIORITARIO"** animado en la esquina superior derecha
- ✅ Número de turno con **degradado morado** en lugar de azul
- ✅ Etiqueta **"♿ Atención Prioritaria"** en la información del paciente

### 3. **Priorización Automática**
El sistema ordena los turnos de la siguiente manera:
1. **Turnos en estado "llamado"** (primero)
2. **Pacientes con discapacidad** (`es_prioritario = true`)
3. Pacientes con otras condiciones especiales (Tercera Edad, Embarazo, etc.)
4. Orden de llegada (fecha de registro)

### 4. **Flujo Simplificado**
Si el paciente indica que tiene discapacidad:
- Se marca automáticamente como `condicion_especial = 'Discapacitado'`
- Se activa el flag `es_prioritario = true`
- **Se salta el paso de selección de condiciones especiales** (va directo a confirmar)

## 🗄️ Cambios en la Base de Datos

### Nueva Columna en `turnos`
```sql
ALTER TABLE turnos ADD COLUMN es_prioritario INTEGER DEFAULT 0
```

### Migración Automática
El sistema incluye un script de migración (`migrar_prioridad.py`) que:
- Agrega la columna `es_prioritario` si no existe
- Actualiza turnos existentes con `condicion_especial = 'Discapacitado'` para marcarlos como prioritarios

## 🎨 Estilo Visual

### Colores y Diseño
- **Morado/Púrpura** (`purple-500` a `purple-800`): Indica prioridad
- **Animaciones**: Badge "PRIORITARIO" con efecto pulse
- **Degradados**: Fondos suaves del morado al índigo
- **Contraste Alto**: Texto legible y accesible

### Iconos
- **♿** (símbolo universal de discapacidad): Usado consistentemente en:
  - Kiosco (botón de selección)
  - Panel de profesionales (badge y etiqueta)
  - Indicador de pasos (icono de prioridad)

## 📱 Experiencia de Usuario

### En el Kiosco (Paciente)
1. Ingresa documento
2. **NUEVO:** Ve su nombre y la pregunta sobre discapacidad
3. Selecciona SÍ o NO con botones grandes y claros
4. Si selecciona SÍ:
   - Ve confirmación: "✓ Tendrás atención prioritaria"
   - En el paso de servicio ve: "♿ Atención prioritaria activada - Serás atendido primero"
5. Confirma el servicio y recibe su turno

### En el Panel de Profesionales
1. Los pacientes prioritarios aparecen **primero** en la lista
2. Tarjetas visualmente destacadas con:
   - Borde morado grueso
   - Fondo degradado
   - Badge "PRIORITARIO" animado
   - Etiqueta "♿ Atención Prioritaria"
3. Flujo de llamado y atención normal

## 🔧 Instalación y Actualización

### Para Bases de Datos Existentes

1. **Ejecutar el script de migración:**
   ```bash
   python migrar_prioridad.py
   ```

2. **Reiniciar el backend:**
   ```bash
   .\restart.bat
   ```

### Para Nuevas Instalaciones
- La columna `es_prioritario` se crea automáticamente al inicializar la base de datos
- No se requiere ninguna acción adicional

## 📊 Orden de Prioridad Completo

```
1. Estado "llamado"
   ↓
2. Pacientes con discapacidad (es_prioritario = 1)
   ↓
3. Otras condiciones especiales:
   - Discapacitado (por si no se marcó como prioritario)
   - Tercera Edad
   - Embarazo
   ↓
4. Orden de llegada (fecha_registro ASC)
```

## 🧪 Testing

### Probar la Funcionalidad

1. **Registrar un paciente prioritario:**
   - Ir al kiosco
   - Ingresar documento
   - Seleccionar "SÍ, tengo discapacidad"
   - Completar registro

2. **Registrar un paciente normal:**
   - Ir al kiosco
   - Ingresar otro documento
   - Seleccionar "NO tengo discapacidad"
   - Completar registro

3. **Verificar en el panel de profesionales:**
   - El paciente prioritario debe aparecer **primero**
   - Debe tener la tarjeta morada con el badge "PRIORITARIO"

## 📝 Notas Técnicas

### Backend (Python/FastAPI)
- `models/schemas.py`: Agregado campo `es_prioritario` a `KioskInput` y `PacienteEnEspera`
- `routers/kiosk_routes.py`: Guarda el valor de `es_prioritario` al registrar turno
- `routers/professional_routes.py`: Ordena turnos por `es_prioritario DESC`
- `database/sqlite_db.py`: Columna `es_prioritario` en tabla `turnos`

### Frontend (React/TypeScript)
- `screens/KioskScreen.tsx`: 
  - Nuevo paso 2 para pregunta de discapacidad
  - Estado `tieneDiscapacidad`
  - Flujo condicional (salta paso 4 si es prioritario)
- `screens/ProfessionalPanel.tsx`:
  - Interface `Turno` actualizada con `es_prioritario`
  - Renderizado condicional con estilos morados
  - Badge "PRIORITARIO" animado

## 🌐 Accesibilidad

Esta funcionalidad está diseñada siguiendo principios de accesibilidad:
- ✅ Alto contraste visual
- ✅ Símbolos universales (♿)
- ✅ Tamaño de botones grande (táctil)
- ✅ Mensajes claros y directos
- ✅ Confirmación visual inmediata

## 📞 Soporte

Para preguntas o problemas con esta funcionalidad, consulte:
- `MANUAL_USUARIO.md` - Guía para usuarios finales
- `ARQUITECTURA_TECNICA.md` - Detalles técnicos del sistema
- `INSTALACION.md` - Instrucciones de instalación y configuración






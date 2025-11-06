# Mejoras en Llamados Simultáneos - Sistema Digiturno

## 📋 Resumen de Mejoras Implementadas

Se han implementado mejoras significativas para manejar múltiples llamados simultáneos en la pantalla de espera.

## ✨ Características Nuevas

### 1. **Visualización de Múltiples Llamados (hasta 3)**

#### Antes:
- Solo se mostraba 1 llamado a la vez
- Llamados simultáneos debían esperar 13 segundos (10s mostrando + 3s polling)

#### Ahora:
- Se muestran hasta **3 llamados simultáneamente** en columnas
- Layout responsivo:
  - **1 llamado**: Ocupa todo el ancho (diseño grande)
  - **2 llamados**: Grid de 2 columnas
  - **3 llamados**: Grid de 3 columnas
- Tamaños de fuente adaptativos según cantidad de llamados

### 2. **Cola de Anuncios de Voz**

#### Antes:
- `window.speechSynthesis.cancel()` cancelaba el anuncio anterior
- Solo se escuchaba el último llamado

#### Ahora:
- **Cola inteligente** de anuncios
- Los anuncios se reproducen **secuencialmente** uno tras otro
- Pausa de 500ms entre cada anuncio para mejor comprensión
- No se pierde ningún anuncio

### 3. **Reducción de Tiempo de Visualización**

#### Antes:
- 10 segundos de visualización

#### Ahora:
- **6 segundos** de visualización
- Mayor dinamismo y fluidez
- Más espacio para mostrar nuevos llamados rápidamente

## 🔧 Cambios Técnicos

### Backend (`backend/routers/display_routes.py`)

**Nuevo Endpoint:** `/api/display/nuevos-llamados`

```python
@router.get("/nuevos-llamados")
async def obtener_nuevos_llamados():
    """Obtiene hasta 3 llamados nuevos para anunciar simultáneamente"""
```

**Características:**
- Obtiene hasta 3 llamados con `mostrado = 0`
- Ordena por `fecha_llamado ASC` (primero en llegar, primero en mostrarse)
- Marca todos como mostrados en una sola transacción
- Retorna array de llamados con texto de anuncio

### Frontend (`frontend/src/screens/DisplayScreen.tsx`)

**Nuevos Estados:**
```typescript
const [llamadosActivos, setLlamadosActivos] = useState<Llamado[]>([])
const colaAnunciosRef = useRef<string[]>([])
const anunciandoRef = useRef(false)
```

**Nueva Función:** `verificarNuevosLlamados()`
- Reemplaza a `verificarNuevoLlamado()` (singular)
- Obtiene múltiples llamados
- Muestra todos simultáneamente
- Agrega anuncios a la cola

**Nueva Función:** `procesarColaAnuncios()`
- Procesa anuncios secuencialmente
- Evita solapamiento con bandera `anunciandoRef`
- Espera a que termine cada anuncio antes del siguiente

**Función Mejorada:** `anunciarLlamado()`
- Ahora retorna una `Promise`
- Usa `utterance.onend` para saber cuando termina
- Pausa de 500ms entre anuncios

### Frontend (`frontend/src/services/api.ts`)

**Nuevo Método:**
```typescript
obtenerNuevosLlamados: async () => {
  const response = await api.get('/display/nuevos-llamados')
  return response.data
}
```

## 📱 Diseño Visual Mejorado

### Layout Responsivo

```
┌─────────────────────────────────────────────────────────┐
│              AHORA LLAMANDO                             │
├──────────────┬─────────────────┬─────────────────────┬──┤
│   Turno 1    │    Turno 2      │     Turno 3         │  │
│   CM-0001    │    CM-0002      │     FA-0001         │  │
│ Santiago B.  │  Mauricio B.    │   Ana García        │  │
│ Ventanilla 1 │  Ventanilla 2   │   Ventanilla 3      │  │
└──────────────┴─────────────────┴─────────────────────┴──┘
```

### Tamaños Adaptativos

| Llamados | Número Turno | Nombre    | Ventanilla |
|----------|--------------|-----------|------------|
| 1        | text-7xl     | text-2xl  | text-4xl   |
| 2        | text-5xl     | text-xl   | text-3xl   |
| 3        | text-4xl     | text-lg   | text-2xl   |

## 🎯 Escenario de Uso

### Ejemplo: Llamados Simultáneos

**Situación:**
- Ventanilla 1 (Citas Médicas) llama a Santiago Bello - 10:30:00.100
- Ventanilla 2 (Citas Médicas) llama a Mauricio Bello - 10:30:00.150
- Ventanilla 3 (Facturación) llama a Ana García - 10:30:00.200

**Resultado:**

#### Tiempo 0-3s (esperando polling):
```
Sin llamados activos (pantalla normal)
```

#### Tiempo 3s (polling detecta 3 llamados):
```
┌─────────────────────────────────────────────────────┐
│ PANTALLA PRINCIPAL (3 columnas, fondo verde):      │
│ Santiago B. → V1 | Mauricio B. → V2 | Ana G. → V3  │
│                                                      │
│ 🔊 "Santiago Bello, diríjase a ventanilla 1..."    │
│    (termina en ~4s)                                 │
└─────────────────────────────────────────────────────┘
```

#### Tiempo 7s (segundo anuncio):
```
┌─────────────────────────────────────────────────────┐
│ PANTALLA PRINCIPAL (3 columnas, fondo verde):      │
│ Santiago B. → V1 | Mauricio B. → V2 | Ana G. → V3  │
│                                                      │
│ 🔊 "Mauricio Bello, diríjase a ventanilla 2..."    │
│    (termina en ~4s)                                 │
└─────────────────────────────────────────────────────┘
```

#### Tiempo 9s (oculta llamados - 6s después de mostrar):
```
Llamados desaparecen, quedan en lista de historial
```

#### Tiempo 11s (tercer anuncio):
```
🔊 "Ana García, diríjase a ventanilla 3..."
```

**Total: ~11 segundos para 3 llamados vs 39 segundos antes**

## ⚡ Mejoras de Rendimiento

### Antes:
- **1 llamado**: 13 segundos (10s mostrar + 3s polling)
- **2 llamados simultáneos**: 26 segundos
- **3 llamados simultáneos**: 39 segundos

### Ahora:
- **1 llamado**: 9 segundos (6s mostrar + 3s polling)
- **2 llamados simultáneos**: 9 segundos (simultáneos)
- **3 llamados simultáneos**: 9 segundos (simultáneos)

**Reducción de tiempo:** hasta **77% más rápido** en escenarios con múltiples llamados

## 🧪 Cómo Probar

### Prueba Manual

1. **Iniciar el sistema:**
   ```bash
   start.bat
   ```

2. **Abrir 3 paneles de profesionales** en diferentes pestañas:
   - Panel 1: Servicio "Citas Médicas", Ventanilla 1
   - Panel 2: Servicio "Citas Médicas", Ventanilla 2
   - Panel 3: Servicio "Facturación", Ventanilla 3

3. **Registrar 3 pacientes** en el kiosco:
   - Paciente 1: Documento válido, servicio "Citas Médicas"
   - Paciente 2: Documento válido, servicio "Citas Médicas"
   - Paciente 3: Documento válido, servicio "Facturación"

4. **Llamar simultáneamente:**
   - En Panel 1: Llamar al Paciente 1
   - En Panel 2: Llamar al Paciente 2 (inmediatamente)
   - En Panel 3: Llamar al Paciente 3 (inmediatamente)

5. **Observar en la pantalla de espera:**
   - Los 3 llamados deberían aparecer simultáneamente en columnas
   - Los anuncios de voz se reproducen uno tras otro
   - Después de 6 segundos desaparecen

### Verificaciones

✅ **Visual:**
- [ ] Se muestran hasta 3 llamados simultáneamente
- [ ] El layout se adapta (1, 2 o 3 columnas)
- [ ] Los tamaños de fuente son proporcionales
- [ ] El fondo verde con animación pulse se mantiene

✅ **Audio:**
- [ ] Se escuchan todos los anuncios
- [ ] No se cancelan entre sí
- [ ] Hay pausa breve entre cada uno
- [ ] Se anuncian en orden de llegada

✅ **Tiempo:**
- [ ] Los llamados se ocultan después de 6 segundos
- [ ] El polling sigue funcionando cada 3 segundos
- [ ] No hay retrasos perceptibles

## 🔄 Compatibilidad

### Navegadores Soportados

| Navegador | Visualización | Text-to-Speech |
|-----------|---------------|----------------|
| Chrome    | ✅ Perfecto    | ✅ Perfecto     |
| Edge      | ✅ Perfecto    | ✅ Perfecto     |
| Firefox   | ✅ Perfecto    | ⚠️ Básico       |
| Safari    | ✅ Perfecto    | ⚠️ Limitado     |

### Recomendación
Usar **Chrome o Edge** para mejor experiencia de voz.

## 📊 Beneficios

1. **Experiencia de Usuario:**
   - Pacientes ven su llamado inmediatamente
   - Menos confusión en horas pico
   - Mayor percepción de eficiencia

2. **Eficiencia Operativa:**
   - Múltiples ventanillas pueden trabajar simultáneamente
   - Reducción de tiempo de espera percibido
   - Mejor flujo de pacientes

3. **Escalabilidad:**
   - Soporta hasta 3 llamados simultáneos
   - Fácil ajustar límite en el código
   - No afecta rendimiento de la base de datos

## 🛠️ Configuración Avanzada

### Ajustar Cantidad Máxima de Llamados

**Backend:** `backend/routers/display_routes.py:100`
```python
LIMIT 3  # Cambiar a 2, 4, 5, etc.
```

**Frontend:** `frontend/src/screens/DisplayScreen.tsx:173-176`
```typescript
// Agregar más condiciones para grid-cols-4, grid-cols-5, etc.
```

### Ajustar Tiempo de Visualización

**Frontend:** `frontend/src/screens/DisplayScreen.tsx:75`
```typescript
}, 6000)  // Cambiar a 5000, 8000, etc. (milisegundos)
```

### Ajustar Pausa entre Anuncios

**Frontend:** `frontend/src/screens/DisplayScreen.tsx:111`
```typescript
setTimeout(() => resolve(), 500)  // Cambiar a 300, 1000, etc.
```

## 📝 Notas Técnicas

- El endpoint anterior `/ultimo-llamado` se mantiene por compatibilidad
- Los llamados se marcan como `mostrado = 1` en una sola transacción
- La cola de anuncios usa `useRef` para evitar re-renders
- Los anuncios son promesas para manejar async/await

## 🎓 Próximas Mejoras Sugeridas

1. Indicador visual de "hablando" durante anuncios
2. Opción para repetir último anuncio
3. Control de volumen desde la pantalla
4. Historial de llamados con filtro por servicio
5. Modo nocturno para la pantalla de espera

---

**Versión:** 2.0  
**Fecha:** Noviembre 2025  
**Desarrollado para:** Hospital Divino Salvador de Sopó


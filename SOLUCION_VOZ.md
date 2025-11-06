# 🔊 Solución al Problema de Voz en la Pantalla de Espera

## ❌ Problema

La voz funcionó una vez y luego dejó de anunciar. El error en consola dice:
```
Voz no activada. Haz clic en la pantalla primero.
```

## 🔍 Causa

Los navegadores modernos (especialmente Chrome y Edge) **bloquean la reproducción automática de audio** por políticas de seguridad. Requieren una **interacción del usuario** (click) antes de permitir que funcione `speechSynthesis`.

## ✅ Solución Implementada

He agregado varias mejoras para solucionar este problema:

### 1. **Botón de Activar Voz Visible**

En la pantalla de espera ahora aparece un botón claro:

```
┌─────────────────────────────┐
│ 🔇 Activar Voz              │  ← Amarillo parpadeante
└─────────────────────────────┘
```

Después de hacer click:

```
┌─────────────────────────────┐
│ 🔊 Voz Activa               │  ← Verde fijo
└─────────────────────────────┘
```

### 2. **Indicador Visual en el Header**

- **Antes de activar**: Botón amarillo parpadeante "🔇 Activar Voz"
- **Después de activar**: Botón verde "🔊 Voz Activa"
- **En el footer**: Mensaje de estado

### 3. **Activación Automática**

La voz se intenta activar automáticamente con el primer click en **cualquier parte** de la pantalla.

### 4. **Workarounds para Chrome**

- Reintentos automáticos si Chrome bloquea el primer intento
- Timeout de seguridad (10 segundos máximo por anuncio)
- Cancelación de anuncios previos antes de iniciar uno nuevo

## 📋 Instrucciones de Uso

### Primera Vez que Abres la Pantalla:

1. **Reinicia el sistema:**
   ```bash
   restart.bat
   ```

2. **Abre la pantalla de espera:**
   - Ir a: http://localhost:3000/display

3. **Activa la voz:**
   - **Opción 1**: Haz click en el botón amarillo "🔇 Activar Voz" en el header
   - **Opción 2**: Haz click en cualquier parte de la pantalla
   - **Opción 3**: Haz click en el indicador amarillo que aparece arriba

4. **Verifica que esté activa:**
   - El botón debe cambiar a verde "🔊 Voz Activa"
   - En el footer debe decir "✅ Sistema de voz activo"

5. **Prueba:**
   - Desde el panel de médicos o profesionales, llama a un paciente
   - Deberías escuchar el anuncio por voz

## 🎯 Qué Dice la Voz

### Para Médicos:
```
"Juan Pérez Gómez, diríjase al consultorio 1"
```

### Para Otros Servicios:
```
"María López, diríjase a la ventanilla 2 de Facturación"
```

## 🛠️ Si Sigue Sin Funcionar

### Opción 1: Usar Chrome o Edge
Firefox y Safari tienen soporte limitado de Text-to-Speech. Chrome es el **más recomendado**.

### Opción 2: Verificar Audio del Sistema
- Asegúrate de que el volumen del PC/TV no esté en mute
- Verifica que los altavoces estén conectados

### Opción 3: Recargar la Página
1. Presiona `F5` para recargar
2. Haz click en "Activar Voz" nuevamente

### Opción 4: Ver Consola (Para Debugging)
Presiona `F12` y busca mensajes:

**Mensajes Normales (Todo OK):**
```
✅ Voz activada correctamente
Voces cargadas: 327
🔊 Anunciando: Juan Pérez...
✅ Anuncio completado
```

**Mensajes de Error:**
```
❌ Error en anuncio: not-allowed
⚠️ Voz no activada. Haz clic en la pantalla primero.
```

Si ves errores, hacer click en "Activar Voz" debe solucionarlo.

## 📺 Configuración Recomendada para TV

1. **Navegador**: Chrome en pantalla completa (F11)
2. **Al iniciar**: Hacer click en "Activar Voz" antes de usar
3. **Volumen**: Ajustar a nivel audible pero no molesto
4. **Auto-inicio**: Configurar Chrome para que abra la URL automáticamente

### Script para Auto-inicio (Windows):

Crear archivo `iniciar_pantalla.bat`:
```batch
@echo off
start chrome --kiosk --app=http://localhost:3000/display
timeout /t 3
REM Después de 3 segundos, hacer click en la pantalla manualmente
```

## 🔧 Configuración Técnica

Los cambios implementados incluyen:

1. **Estado de voz**: `vozActivada` (true/false)
2. **Botón de activación**: Visible y accesible
3. **Workaround Chrome**: Reintentos automáticos
4. **Timeouts**: Máximo 10 segundos por anuncio
5. **Cola de anuncios**: Procesa múltiples llamados en secuencia
6. **Detección de servicio**: Dice "consultorio" para médicos

## ✅ Checklist de Verificación

- [ ] Reiniciar el sistema con `restart.bat`
- [ ] Abrir pantalla de espera
- [ ] Hacer click en "Activar Voz"
- [ ] Verificar que el botón esté en verde
- [ ] Llamar a un paciente de prueba
- [ ] Escuchar el anuncio
- [ ] Verificar que los siguientes llamados también se anuncian

---

**Nota**: Es normal que después de cada reinicio del navegador tengas que hacer click en "Activar Voz" nuevamente. Es una limitación de seguridad de los navegadores modernos.


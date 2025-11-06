# Solución para Google Chrome - Anuncios de Voz

## 🔍 Problema Identificado

**Funciona en Edge ✅ pero NO en Chrome ❌**

Este es un problema conocido causado por la **política de autoplay de Chrome**, que es más estricta que otros navegadores.

## 🎯 ¿Por qué pasa esto?

Chrome requiere una **interacción del usuario** antes de permitir que el sitio web reproduzca audio automáticamente. Esto incluye Text-to-Speech (anuncios de voz).

### Edge vs Chrome:
- **Edge**: Permite autoplay de TTS por defecto ✅
- **Chrome**: Requiere clic del usuario primero ⚠️

## ✅ Solución Implementada

He agregado **3 mejoras** específicas para Chrome:

### 1. **Botón de Activación Visible**

Cuando abras la pantalla de espera en Chrome, verás un **botón amarillo** en la esquina superior derecha:

```
⚠️ Haz clic aquí para activar anuncios de voz
```

**Acción:** Simplemente haz clic en ese botón una vez.

### 2. **Activación Automática con Primer Clic**

Si haces clic **en cualquier parte** de la pantalla, se activará automáticamente el sistema de voz.

### 3. **Carga Inteligente de Voces**

Chrome carga las voces de forma asíncrona. El sistema ahora espera a que las voces estén disponibles antes de intentar anunciar.

### 4. **Workaround para Chrome**

Si Chrome no inicia el anuncio a la primera, el sistema automáticamente reintenta después de 200ms.

## 📋 Instrucciones de Uso en Chrome

### Primera Vez (Configuración Única):

1. **Abrir la pantalla de espera:**
   ```
   http://localhost:3000/display
   ```

2. **Hacer clic en el botón amarillo:**
   - Verás: "⚠️ Haz clic aquí para activar anuncios de voz"
   - Haz clic UNA VEZ
   - El botón desaparecerá

3. **¡Listo!**
   - Ahora los anuncios funcionarán normalmente
   - No necesitas hacer clic de nuevo

### Verificación:

Abre la **consola** (F12) y deberías ver:

```
Voces cargadas: [número]
Activando voz con interacción del usuario...
```

Cuando llames a un paciente:

```
Nuevos llamados detectados: 1
Agregando a cola: [nombre]...
Iniciando procesamiento de cola, anuncios en cola: 1
Usando voz: [nombre de la voz] es-ES
🔊 Ejecutando speak()...
✅ Anuncio iniciado: [texto]...
✅ Anuncio finalizado correctamente
```

## 🔧 Configuración Avanzada de Chrome (Opcional)

Si quieres que Chrome permita autoplay sin necesidad de clic:

### Opción 1: Permitir sonido para el sitio

1. En Chrome, ir a: `chrome://settings/content/sound`
2. En "Permitidos para reproducir sonido", agregar:
   ```
   http://localhost:3000
   ```

### Opción 2: Deshabilitar política de autoplay (No recomendado para producción)

1. Ir a: `chrome://flags/#autoplay-policy`
2. Cambiar a: **"No user gesture is required"**
3. Reiniciar Chrome

⚠️ **Advertencia:** Esta opción afecta TODOS los sitios web.

### Opción 3: Usar parámetros de línea de comandos

Ejecutar Chrome con:
```bash
chrome.exe --autoplay-policy=no-user-gesture-required
```

## 🆚 Comparación de Navegadores

| Navegador | Requiere Clic | Calidad de Voz | Recomendación |
|-----------|---------------|----------------|---------------|
| **Edge** | ❌ No | ⭐⭐⭐⭐⭐ | ✅ RECOMENDADO |
| **Chrome** | ✅ Sí (solo una vez) | ⭐⭐⭐⭐⭐ | ✅ OK (con clic inicial) |
| Firefox | ⚠️ A veces | ⭐⭐⭐ | ⚠️ No recomendado |
| Safari | ✅ Sí | ⭐⭐ | ❌ No recomendado |

## 💡 Recomendación para Producción

### Para la **Pantalla de Espera** (TV/Monitor):

**Opción A - Edge (Recomendado):**
```
✅ No requiere clic
✅ Autoplay funciona automáticamente
✅ Mejor para uso desatendido
```

**Opción B - Chrome:**
```
⚠️ Requiere 1 clic al inicio del día
✅ Después funciona perfectamente
✅ Misma calidad de voz que Edge
```

### Flujo Recomendado:

1. **Al inicio del día:**
   - Abrir pantalla de espera en **Edge**
   - O si usas Chrome, hacer clic en el botón amarillo

2. **Dejar la pantalla abierta todo el día**
   - No cerrar el navegador
   - Los anuncios funcionarán automáticamente

3. **Si se cierra accidentalmente:**
   - Volver a abrir
   - En Chrome: hacer clic nuevamente en el botón

## 🧪 Pruebas

### Test 1: Verificar que Chrome detecta las voces

Abre la consola (F12) en la pantalla de espera y ejecuta:

```javascript
window.speechSynthesis.getVoices()
```

**Resultado esperado:**
```javascript
[
  {name: "Microsoft Helena - Spanish (Spain)", lang: "es-ES", ...},
  {name: "Microsoft Sabina - Spanish (Mexico)", lang: "es-MX", ...},
  // ... más voces
]
```

Si el array está vacío, cierra y vuelve a abrir Chrome.

### Test 2: Verificar activación de voz

En consola, verifica que aparezca:

```
Voces cargadas: 35
Activando voz con interacción del usuario...
```

Si no aparece, haz clic en cualquier parte de la pantalla.

### Test 3: Probar anuncio manual

En consola, ejecuta:

```javascript
const test = new SpeechSynthesisUtterance("Mauricio Bello, diríjase a la ventanilla uno");
test.lang = 'es-ES';
window.speechSynthesis.speak(test);
```

Deberías escuchar el anuncio. Si no, revisa el volumen del sistema.

## 🐛 Troubleshooting Específico de Chrome

### Problema: El botón amarillo no aparece

**Causa:** Las voces ya se cargaron automáticamente.

**Solución:** Haz clic en cualquier parte de la pantalla una vez.

### Problema: Aparece el mensaje "Voz no activada"

**En consola:**
```
Voz no activada. Haz clic en la pantalla primero.
```

**Solución:** Haz clic en el botón amarillo o en cualquier parte de la pantalla.

### Problema: Solo el primer anuncio falla

**En consola:**
```
⚠️ Chrome workaround: reintentando speak()
✅ Anuncio iniciado...
```

**Esto es normal.** El sistema reintenta automáticamente y debería funcionar.

### Problema: Los anuncios suenan cortados

**Causa:** Rendimiento del sistema o conflicto con otras aplicaciones.

**Soluciones:**
1. Cerrar pestañas innecesarias de Chrome
2. Verificar uso de CPU (no debe estar al 100%)
3. Reiniciar Chrome

### Problema: Las voces suenan en inglés

**En consola, verás:**
```
No se encontró voz en español, usando predeterminada
```

**Solución:** Instalar voces en español en Windows:
1. `Configuración` → `Hora e idioma` → `Voz`
2. Agregar voces en español
3. Reiniciar Chrome

## 📊 Logs Esperados (Chrome)

Al cargar la página:
```
Voces cargadas: 35
```

Al hacer clic:
```
Activando voz con interacción del usuario...
```

Al llamar a un paciente:
```
Nuevos llamados detectados: 1
Agregando a cola: Mauricio Bello, diríjase a la ventanilla 1 de Citas Médicas
Iniciando procesamiento de cola, anuncios en cola: 1
Anunciando: Mauricio Bello, diríjase a la ventanilla 1 de Citas Médicas
Usando voz: Microsoft Helena - Spanish (Spain) es-ES
🔊 Ejecutando speak()...
✅ Anuncio iniciado: Mauricio Bello, diríjase a l...
✅ Anuncio finalizado correctamente
Cola de anuncios completada
```

## 🎬 Video Tutorial (Pasos)

1. Abrir `http://localhost:3000/display` en Chrome
2. Ver botón amarillo en esquina superior derecha
3. Hacer clic en el botón
4. El botón desaparece
5. Llamar a un paciente desde panel de profesionales
6. Escuchar anuncio por voz
7. ✅ ¡Funcionando!

## ✅ Checklist Final

- [ ] Pantalla de espera abierta en Chrome
- [ ] Hiciste clic en el botón amarillo (o en cualquier parte)
- [ ] El botón amarillo desapareció
- [ ] En consola dice "Voces cargadas: [número]"
- [ ] En consola dice "Activando voz con interacción del usuario..."
- [ ] Llamaste a un paciente de prueba
- [ ] En consola aparecen logs de "Nuevos llamados detectados"
- [ ] Escuchaste el anuncio por voz
- [ ] El anuncio dice nombre y ventanilla correctamente

## 🎉 Resumen

**El problema está SOLUCIONADO:**

1. ✅ Chrome ahora carga las voces correctamente
2. ✅ Un botón visible permite activar la voz con un clic
3. ✅ Sistema de reintentos automáticos para Chrome
4. ✅ Logs detallados para debugging
5. ✅ Funciona igual que Edge (después del clic inicial)

**Recomendación:** Para la pantalla de espera permanente, usa **Edge** (no requiere clic). Para uso ocasional en Chrome, simplemente **haz clic una vez al abrir** la pantalla.

---

**Actualizado:** Noviembre 2025  
**Sistema:** Digiturno v2.1 - Hospital Divino Salvador de Sopó


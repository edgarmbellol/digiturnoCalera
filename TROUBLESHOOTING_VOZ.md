# Guía de Troubleshooting - Sistema de Voz (Text-to-Speech)

## 🔧 Problema: La pantalla de espera no está anunciando llamados por voz

### Mejoras Aplicadas

He mejorado el sistema de voz con:
- ✅ **Logs de debugging detallados** en consola
- ✅ **Timeout de seguridad** (10 segundos máximo por anuncio)
- ✅ **Cancelación automática** de anuncios previos
- ✅ **Pausa de 100ms** antes de cada anuncio para estabilidad
- ✅ **Control de errores mejorado** con múltiples handlers

## 🔍 Diagnóstico Paso a Paso

### 1. Verificar la Consola del Navegador

**Abrir la consola:**
- En Chrome/Edge: Presiona `F12` o `Ctrl + Shift + I`
- Ir a la pestaña "Console"

**Buscar estos mensajes cuando se llame a un paciente:**

```javascript
// Debería ver:
"Nuevos llamados detectados: 1"
"Agregando a cola: [nombre], diríjase a ventanilla..."
"Iniciando procesamiento de cola, anuncios en cola: 1"
"Anunciando: [texto completo]"
"Ejecutando speak()..."
"Anuncio iniciado"
"Anuncio finalizado"
"Cola de anuncios completada"
```

### 2. Diagnóstico según Mensajes

#### ✅ Si VE los mensajes pero NO escucha voz:

**Problema: Configuración del navegador o sistema**

**Soluciones:**

1. **Verificar volumen del sistema:**
   - Asegúrate que el volumen de Windows no esté en 0
   - Verifica que no esté silenciado

2. **Verificar permisos del navegador:**
   - Chrome: `chrome://settings/content/sound`
   - Verificar que el sitio tenga permiso para reproducir sonido

3. **Probar el sintetizador manualmente:**
   - Abre la consola (F12) en la pantalla de espera
   - Ejecuta este código:
   ```javascript
   const utterance = new SpeechSynthesisUtterance("Prueba de audio");
   utterance.lang = 'es-ES';
   window.speechSynthesis.speak(utterance);
   ```
   - Si esto NO habla, el problema es del navegador/sistema

4. **Verificar voces disponibles:**
   - En consola, ejecuta:
   ```javascript
   window.speechSynthesis.getVoices()
   ```
   - Debe mostrar un array con voces disponibles
   - Si el array está vacío, reinicia el navegador

5. **Probar en otro navegador:**
   - Chrome (recomendado - mejor soporte)
   - Edge (recomendado - mejor soporte)
   - Firefox (soporte básico)

#### ❌ Si NO VE los mensajes:

**Problema: Los llamados no se están registrando**

**Verificar:**

1. **Backend funcionando:**
   - Abre: `http://localhost:8000/docs`
   - Prueba el endpoint: `GET /api/display/nuevos-llamados`
   - Debe retornar: `{"hay_llamados": false, "llamados": []}`

2. **Base de datos:**
   - Verificar que existan llamados con `mostrado = 0`
   - Si todos están marcados como `mostrado = 1`, no habrá anuncios

3. **Red:**
   - Verificar que la pantalla se esté conectando al backend
   - Revisar errores de red en la consola

#### ⚠️ Si VE error: "SpeechSynthesis no disponible"

**Problema: Navegador no compatible**

**Solución:**
- Usa Chrome o Edge (mejor compatibilidad)
- Evita Firefox o Safari (soporte limitado)

#### ⚠️ Si VE: "Timeout en anuncio, continuando..."

**Problema: El sintetizador se está trabando**

**Soluciones:**
1. Refrescar la página (F5)
2. Reiniciar el navegador
3. Reiniciar el sistema

### 3. Casos Especiales

#### El primer llamado no habla, pero los siguientes sí

**Causa:** Algunos navegadores requieren interacción del usuario antes de usar audio.

**Solución:**
- Hacer clic en cualquier parte de la pantalla antes del primer llamado
- O agregar un botón de "Iniciar Sistema" que active el audio

#### La voz se escucha robótica o cortada

**Causa:** Problema de rendimiento o voz del sistema.

**Solución:**
1. Verificar que el CPU no esté al 100%
2. Cerrar otras aplicaciones
3. Instalar voces mejoradas de Windows:
   - `Configuración` → `Hora e idioma` → `Voz`
   - Agregar voces en español

#### Solo anuncia algunos llamados

**Causa:** La cola se está bloqueando.

**Solución:**
- Revisar en consola si dice "Ya hay anuncios en proceso, saltando..."
- El sistema debería procesar todos, pero si se traba, refresca la página

## 🧪 Pruebas de Diagnóstico

### Prueba 1: Test Manual de Voz

```javascript
// Copiar y pegar en consola de la pantalla de espera:
const testVoz = () => {
  const utterance = new SpeechSynthesisUtterance(
    "Mauricio Bello, diríjase a la ventanilla uno de Citas Médicas"
  );
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  utterance.onstart = () => console.log('✅ Voz iniciada');
  utterance.onend = () => console.log('✅ Voz finalizada');
  utterance.onerror = (e) => console.error('❌ Error:', e);
  
  window.speechSynthesis.speak(utterance);
};

testVoz();
```

**Resultado esperado:**
- Debe escuchar el anuncio
- Ver en consola: "✅ Voz iniciada" y "✅ Voz finalizada"

### Prueba 2: Simular Llamado desde Backend

```bash
# En consola del sistema:
curl http://localhost:8000/api/display/nuevos-llamados
```

**Resultado esperado:**
```json
{
  "hay_llamados": true,
  "cantidad": 1,
  "llamados": [
    {
      "id": 1,
      "numero_turno": "CM-0001",
      "nombre_paciente": "Mauricio Bello",
      "servicio": "Citas Médicas",
      "ventanilla": 1,
      "texto_anuncio": "Mauricio Bello, diríjase a la ventanilla 1..."
    }
  ]
}
```

### Prueba 3: Verificar Polling

```javascript
// En consola de la pantalla:
// Debe ver esto cada 3 segundos:
// "Verificando nuevos llamados..." (si agregamos el log)
```

## 🔄 Soluciones Rápidas (Quick Fixes)

1. **Refrescar la página** (F5)
2. **Cerrar y reabrir el navegador**
3. **Verificar que el volumen NO esté en 0**
4. **Hacer clic en la pantalla** antes del primer llamado
5. **Usar Chrome o Edge** (mejor soporte TTS)
6. **Reiniciar el servidor** con `restart.bat`

## 📋 Checklist de Verificación

- [ ] Backend corriendo (`http://localhost:8000/docs`)
- [ ] Frontend corriendo (`http://localhost:3000`)
- [ ] Navegador Chrome o Edge
- [ ] Volumen del sistema activado
- [ ] Consola del navegador abierta (F12)
- [ ] Sin errores en consola roja
- [ ] Al llamar paciente, ve logs en consola
- [ ] Al ejecutar test manual de voz, escucha audio
- [ ] Voces instaladas en Windows (`window.speechSynthesis.getVoices()` retorna array)

## 🛠️ Si Nada Funciona

### Plan B: Verificar instalación de voces en Windows

1. Abrir `Configuración` de Windows
2. Ir a `Hora e idioma` → `Voz`
3. En "Administrar voces", agregar voces de español:
   - Español (España) - Helena
   - Español (México) - Sabina
   - Español (Colombia) - Carlos

### Plan C: Usar navegador en modo incógnito

A veces extensiones bloquean el audio:
```
Ctrl + Shift + N (Chrome/Edge)
```

### Plan D: Verificar política de autoplay del navegador

1. Chrome: `chrome://flags/#autoplay-policy`
2. Establecer en: "No user gesture is required"
3. Reiniciar navegador

## 📞 Información para Soporte

Si necesitas reportar el problema, incluye:

1. **Navegador y versión:**
   - Ir a: `chrome://version/` o `edge://version/`

2. **Logs de consola:**
   - Captura de pantalla de la consola cuando llamas a un paciente

3. **Resultado de pruebas:**
   - ¿Funciona el test manual de voz?
   - ¿Qué retorna `window.speechSynthesis.getVoices()`?

4. **Sistema operativo:**
   - Windows 10/11 + versión

## 💡 Recomendaciones

**Para mejor experiencia:**
- ✅ Usar **Chrome** o **Edge** (versión más reciente)
- ✅ Mantener **volumen entre 70-100%**
- ✅ Instalar **voces de calidad** en Windows
- ✅ Tener **altavoces externos** (mejor que laptop)
- ✅ **Interactuar con la página** una vez antes de usarla
- ❌ Evitar Firefox o Safari (soporte limitado)
- ❌ No usar modo silencioso en el navegador

---

**Última actualización:** Noviembre 2025  
**Sistema:** Digiturno v2.0 - Hospital Divino Salvador de Sopó


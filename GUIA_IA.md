# 🤖 Guía del Sistema de Inteligencia Artificial

## Descripción General

El sistema Digiturno integra **Google Gemini AI** para proporcionar análisis inteligentes y recomendaciones sobre el funcionamiento del servicio hospitalario.

## ✨ Funcionalidades

### Análisis de Turnos
El sistema puede analizar automáticamente:
- ✅ Rendimiento de profesionales
- ✅ Tiempos de espera promedio
- ✅ Patrones de no asistencia
- ✅ Distribución de turnos por servicio
- ✅ Recomendaciones accionables

## 📊 Tipos de Análisis

### ⚡ Análisis Rápido (25 turnos)
- **Uso**: Monitoreo frecuente
- **Tiempo**: ~5-10 segundos
- **Recomendado para**: Revisiones diarias

### 📊 Análisis Medio (50 turnos)
- **Uso**: Balance entre detalle y rapidez
- **Tiempo**: ~10-15 segundos
- **Recomendado para**: Revisiones semanales

### 🔍 Análisis Completo (100 turnos)
- **Uso**: Análisis profundo
- **Tiempo**: ~15-20 segundos
- **Recomendado para**: Reportes mensuales

## ⚠️ Límites de API (Error 429)

### ¿Qué significa el error 429?
El error **"429 Resource exhausted"** ocurre cuando:
- Has excedido el número de solicitudes por minuto
- Has alcanzado el límite diario de la cuota gratuita
- La API está temporalmente sobrecargada

### Límites de Gemini API (Cuota Gratuita)

**Límites por minuto:**
- 15 requests/minuto
- 1 millón de tokens/minuto

**Límites por día:**
- 1,500 requests/día
- 1 millón de tokens/día

### ✅ Soluciones

1. **Esperar 1-2 minutos** antes de intentar de nuevo
2. **Reducir el número de turnos** a analizar (usar análisis rápido)
3. **Espaciar las solicitudes** en el tiempo
4. **Considerar actualizar a cuota de pago** si el uso es muy frecuente

## 🔧 Optimizaciones Implementadas

### Reducción de Tokens
El sistema ahora:
- ✅ Envía resúmenes estadísticos en lugar de todos los datos
- ✅ Limita el prompt a máximo 500 palabras de respuesta
- ✅ Pre-calcula estadísticas localmente
- ✅ Solo envía una muestra de turnos (primeros 10)

Esto reduce el consumo de tokens en ~70% comparado con la versión anterior.

### Mensajes de Error Claros
El sistema ahora muestra:
- ✅ Tipo de error específico (cuota, autenticación, etc.)
- ✅ Mensaje descriptivo en español
- ✅ Sugerencias de solución
- ✅ Detalle técnico para debugging

## 🔑 Configuración de API Key

### Obtener una API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea un nuevo proyecto (si no tienes uno)
3. Genera una nueva API key
4. Copia la key

### Configurar en el Sistema

1. Abre `backend/config.py`
2. Localiza la línea:
   ```python
   GEMINI_API_KEY: str = "TU_API_KEY_AQUI"
   ```
3. Reemplaza `"TU_API_KEY_AQUI"` con tu API key real
4. Guarda el archivo
5. Reinicia el backend:
   ```bash
   .\restart.bat
   ```

### Verificar Configuración

Si ves el error **"API key invalid"**, verifica:
- ✅ La API key está correctamente copiada (sin espacios extra)
- ✅ La API key está activa en Google Cloud Console
- ✅ Gemini API está habilitada en tu proyecto de Google Cloud

## 📈 Actualizar a Cuota de Pago

Si necesitas más requests:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Navega a "APIs & Services" > "Gemini API"
4. Configura un método de pago
5. Los límites aumentarán a:
   - **60 requests/minuto**
   - **10 millones de tokens/minuto**
   - Sin límite diario estricto

**Costo estimado:** ~$0.001 - $0.01 por análisis (muy económico)

## 🛠️ Troubleshooting

### El análisis no se genera
1. Verifica conexión a internet
2. Revisa la API key en `config.py`
3. Mira la consola del backend para errores detallados
4. Verifica que no hayas excedido los límites

### El análisis es muy genérico
- Intenta analizar más turnos (50-100)
- Asegúrate de que hay datos variados en el período analizado

### Error de autenticación
- Verifica que la API key sea correcta
- Asegúrate de que Gemini API esté habilitada en tu proyecto

## 📝 Logs y Debugging

El backend muestra logs detallados:

```
🤖 Llamando a Gemini para analizar 50 turnos...
✅ Análisis completado exitosamente
```

o en caso de error:

```
❌ Error en análisis con IA: 429 Resource exhausted
```

Revisa la terminal del backend para ver estos mensajes.

## 🎯 Mejores Prácticas

1. **Uso moderado**: No generar análisis cada pocos minutos
2. **Análisis rápido primero**: Comienza con 25 turnos
3. **Horarios de bajo uso**: Realizar análisis completos en horarios valle
4. **Guardar resultados**: Copia los análisis importantes para futuras referencias
5. **Revisar cuota**: Monitorea el uso en Google Cloud Console

## 📚 Referencias

- [Documentación de Gemini API](https://ai.google.dev/docs)
- [Límites y cuotas](https://ai.google.dev/pricing)
- [Google AI Studio](https://makersuite.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Última actualización:** Noviembre 2025
**Versión del sistema:** 2.0


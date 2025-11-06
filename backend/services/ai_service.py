"""Servicio de Inteligencia Artificial con Google Gemini"""
import google.generativeai as genai
from config import settings
from datetime import datetime, timedelta
import json

# Configurar API de Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Sistema de caché simple (en memoria)
_cache_analisis = {
    "ultimo_analisis": None,
    "fecha_ultimo_analisis": None,
    "turnos_analizados": 0
}


async def analizar_turnos_con_ia(turnos_data: list) -> dict:
    """Analiza los turnos usando Gemini para generar insights"""
    
    try:
        # Verificar si hay caché válido (menos de 5 minutos)
        if _cache_analisis["ultimo_analisis"] and _cache_analisis["fecha_ultimo_analisis"]:
            tiempo_transcurrido = datetime.now() - _cache_analisis["fecha_ultimo_analisis"]
            if tiempo_transcurrido < timedelta(minutes=5) and _cache_analisis["turnos_analizados"] == len(turnos_data):
                print(f"📦 Usando análisis en caché (generado hace {int(tiempo_transcurrido.total_seconds())} segundos)")
                resultado = _cache_analisis["ultimo_analisis"].copy()
                resultado["desde_cache"] = True
                resultado["cache_edad_segundos"] = int(tiempo_transcurrido.total_seconds())
                return resultado
        # Preparar resumen de datos (no enviar todo para reducir tokens)
        total_turnos = len(turnos_data)
        
        # Calcular estadísticas básicas
        por_servicio = {}
        por_estado = {}
        tiempos_espera = []
        profesionales = {}
        
        for turno in turnos_data:
            servicio = turno.get('servicio', 'Unknown')
            estado = turno.get('estado', 'Unknown')
            profesional = turno.get('profesional', 'Unknown')
            
            por_servicio[servicio] = por_servicio.get(servicio, 0) + 1
            por_estado[estado] = por_estado.get(estado, 0) + 1
            
            if turno.get('tiempo_espera_minutos'):
                tiempos_espera.append(turno['tiempo_espera_minutos'])
            
            if profesional and profesional != 'Unknown':
                profesionales[profesional] = profesionales.get(profesional, 0) + 1
        
        promedio_espera = sum(tiempos_espera) / len(tiempos_espera) if tiempos_espera else 0
        
        # Crear prompt OPTIMIZADO para Gemini (menos tokens)
        prompt = f"""
Eres un experto en análisis de servicios hospitalarios.

Analiza estos datos del Hospital Divino Salvador de Sopó:

**RESUMEN:**
- Total turnos: {total_turnos}
- Tiempo promedio espera: {promedio_espera:.1f} minutos
- Por servicio: {por_servicio}
- Por estado: {por_estado}
- Turnos por profesional: {profesionales}
- Turnos con más espera: {sorted(tiempos_espera, reverse=True)[:5] if tiempos_espera else []}

**MUESTRA DE TURNOS (primeros 10):**
{turnos_data[:10]}

Genera un análisis CONCISO (máximo 500 palabras) que incluya:

1. **RESUMEN EJECUTIVO**
   - Visión general del rendimiento del servicio
   - Principales hallazgos (máximo 3 puntos)

2. **ANÁLISIS DE TIEMPOS**
   - Tiempo promedio de espera por servicio
   - Servicios más rápidos y más lentos
   - Horarios pico identificados

3. **PROFESIONALES**
   - Profesionales con mejor rendimiento (más turnos atendidos)
   - Profesionales que podrían necesitar soporte
   - Distribución de carga de trabajo

4. **PACIENTES QUE NO RESPONDIERON**
   - Porcentaje de no respuesta por servicio
   - Patrones identificados en las observaciones
   - Posibles causas

5. **CONDICIONES ESPECIALES**
   - Cómo se están atendiendo pacientes prioritarios
   - Tiempos de espera de discapacitados, tercera edad, embarazadas

6. **RECOMENDACIONES ACCIONABLES**
   - 3-5 recomendaciones específicas para mejorar el servicio
   - Priorizar por impacto

7. **INDICADORES CLAVE (KPIs)**
   - Tasa de atención exitosa
   - Tiempo promedio de espera
   - Eficiencia por servicio

Responde en español, de forma clara y profesional. Usa formato Markdown con títulos y listas.
Sé específico con números y porcentajes.
"""
        
        # Llamar a Gemini con configuración de seguridad
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
        )
        
        print(f"🤖 Llamando a Gemini para analizar {len(turnos_data)} turnos...")
        response = model.generate_content(prompt)
        print(f"✅ Análisis completado exitosamente")
        
        resultado = {
            "success": True,
            "analisis": response.text,
            "fecha_analisis": datetime.now().isoformat(),
            "turnos_analizados": len(turnos_data),
            "desde_cache": False
        }
        
        # Guardar en caché
        _cache_analisis["ultimo_analisis"] = resultado
        _cache_analisis["fecha_ultimo_analisis"] = datetime.now()
        _cache_analisis["turnos_analizados"] = len(turnos_data)
        
        return resultado
    
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error en análisis con IA: {error_msg}")
        
        # Mensajes de error específicos
        if "429" in error_msg or "Resource exhausted" in error_msg:
            return {
                "success": False,
                "error": "quota_exceeded",
                "mensaje": "Límite de solicitudes alcanzado. Por favor espera unos minutos e intenta de nuevo.",
                "detalle": "La API de Gemini tiene límites de uso. Intenta reducir el número de turnos a analizar."
            }
        elif "API key" in error_msg or "authentication" in error_msg.lower():
            return {
                "success": False,
                "error": "api_key_invalid",
                "mensaje": "Error de autenticación con Google Gemini. Verifica la API key.",
                "detalle": str(e)
            }
        else:
            return {
                "success": False,
                "error": "unknown",
                "mensaje": "No se pudo generar el análisis con IA",
                "detalle": str(e)
            }


async def generar_recomendaciones_servicio(servicio: str, turnos_servicio: list) -> dict:
    """Genera recomendaciones específicas para un servicio"""
    
    try:
        prompt = f"""
Analiza el servicio de {servicio} con los siguientes datos:

{json.dumps(turnos_servicio, indent=2, ensure_ascii=False)}

Genera:
1. Análisis del rendimiento actual
2. 3 recomendaciones específicas para este servicio
3. Métricas clave

Responde en español, formato Markdown, máximo 300 palabras.
"""
        
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "servicio": servicio,
            "recomendaciones": response.text
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


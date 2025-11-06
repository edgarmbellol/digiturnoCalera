"""Rutas para funcionalidades de Inteligencia Artificial"""
from fastapi import APIRouter, HTTPException
from database.sqlite_db import get_db_connection
from services.ai_service import analizar_turnos_con_ia, generar_recomendaciones_servicio
from datetime import datetime

router = APIRouter()


@router.get("/analizar-turnos")
async def analizar_turnos_historicos(limit: int = 100):
    """Analiza los últimos turnos usando IA para generar insights"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Obtener los últimos N turnos atendidos o marcados como no_responde
        cursor.execute("""
            SELECT 
                numero_turno,
                documento,
                nombre_paciente,
                servicio,
                condicion_especial,
                ventanilla,
                estado,
                profesional_codigo,
                observacion,
                fecha_registro,
                fecha_llamado,
                fecha_atencion,
                rellamado
            FROM turnos
            WHERE estado IN ('atendido', 'no_responde')
            ORDER BY fecha_atencion DESC
            LIMIT ?
        """, (limit,))
        
        turnos = cursor.fetchall()
        
        if not turnos:
            raise HTTPException(status_code=404, detail="No hay turnos atendidos para analizar")
        
        # Convertir a lista de diccionarios
        turnos_data = []
        for turno in turnos:
            # Calcular tiempo de espera si hay fechas
            tiempo_espera = None
            if turno['fecha_llamado'] and turno['fecha_registro']:
                try:
                    fecha_reg = datetime.fromisoformat(turno['fecha_registro'])
                    fecha_llam = datetime.fromisoformat(turno['fecha_llamado'])
                    tiempo_espera = int((fecha_llam - fecha_reg).total_seconds() / 60)
                except:
                    pass
            
            turnos_data.append({
                "numero_turno": turno['numero_turno'],
                "nombre_paciente": turno['nombre_paciente'],
                "servicio": turno['servicio'],
                "condicion_especial": turno['condicion_especial'],
                "ventanilla": turno['ventanilla'],
                "estado": turno['estado'],
                "profesional": turno['profesional_codigo'],
                "observacion": turno['observacion'],
                "tiempo_espera_minutos": tiempo_espera,
                "rellamado": turno['rellamado'],
                "fecha_atencion": str(turno['fecha_atencion']) if turno['fecha_atencion'] else None
            })
        
        # Generar análisis con IA
        resultado = await analizar_turnos_con_ia(turnos_data)
        
        return resultado
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al analizar turnos: {str(e)}")
    
    finally:
        conn.close()


@router.get("/analizar-servicio/{servicio}")
async def analizar_servicio_especifico(servicio: str, limit: int = 50):
    """Analiza un servicio específico usando IA"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                numero_turno,
                nombre_paciente,
                condicion_especial,
                ventanilla,
                estado,
                profesional_codigo,
                observacion,
                fecha_registro,
                fecha_llamado,
                fecha_atencion
            FROM turnos
            WHERE servicio = ? AND estado IN ('atendido', 'no_responde')
            ORDER BY fecha_atencion DESC
            LIMIT ?
        """, (servicio, limit))
        
        turnos = cursor.fetchall()
        
        if not turnos:
            raise HTTPException(status_code=404, detail=f"No hay datos para el servicio {servicio}")
        
        turnos_data = []
        for turno in turnos:
            tiempo_espera = None
            if turno['fecha_llamado'] and turno['fecha_registro']:
                try:
                    fecha_reg = datetime.fromisoformat(turno['fecha_registro'])
                    fecha_llam = datetime.fromisoformat(turno['fecha_llamado'])
                    tiempo_espera = int((fecha_llam - fecha_reg).total_seconds() / 60)
                except:
                    pass
            
            turnos_data.append({
                "numero_turno": turno['numero_turno'],
                "nombre_paciente": turno['nombre_paciente'],
                "condicion_especial": turno['condicion_especial'],
                "estado": turno['estado'],
                "profesional": turno['profesional_codigo'],
                "observacion": turno['observacion'],
                "tiempo_espera_minutos": tiempo_espera
            })
        
        resultado = await generar_recomendaciones_servicio(servicio, turnos_data)
        
        return resultado
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
    finally:
        conn.close()


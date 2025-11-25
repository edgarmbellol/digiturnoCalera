"""Rutas para la pantalla de espera"""
from fastapi import APIRouter
from typing import List
from datetime import datetime

from models.schemas import LlamadoDisplay, PacienteEnEspera
from database.sqlite_db import get_db_connection

router = APIRouter()


@router.get("/llamados-recientes", response_model=List[LlamadoDisplay])
async def obtener_llamados_recientes(limit: int = 5):
    """Obtiene los últimos llamados para mostrar en pantalla"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, numero_turno, nombre_paciente, servicio, ventanilla, fecha_llamado
            FROM llamados
            ORDER BY fecha_llamado DESC
            LIMIT ?
        """, (limit,))
        
        llamados = cursor.fetchall()
        
        resultado = []
        for llamado in llamados:
            resultado.append(LlamadoDisplay(
                id=llamado['id'],
                numero_turno=llamado['numero_turno'],
                nombre_paciente=llamado['nombre_paciente'],
                servicio=llamado['servicio'],
                ventanilla=llamado['ventanilla'],
                fecha_llamado=str(llamado['fecha_llamado'])
            ))
        
        return resultado
    
    finally:
        conn.close()


@router.get("/ultimo-llamado")
async def obtener_ultimo_llamado():
    """Obtiene el último llamado para anunciar por voz (DEPRECATED - usar /nuevos-llamados)"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, numero_turno, nombre_paciente, servicio, ventanilla, fecha_llamado
            FROM llamados
            WHERE mostrado = 0
            ORDER BY fecha_llamado DESC
            LIMIT 1
        """)
        
        llamado = cursor.fetchone()
        
        if not llamado:
            return {"hay_llamado": False}
        
        # Marcar como mostrado
        cursor.execute("""
            UPDATE llamados SET mostrado = 1 WHERE id = ?
        """, (llamado['id'],))
        
        conn.commit()
        
        # Determinar si es consultorio médico o ventanilla
        # SOLO "Consulta Médica" es consultorio, los demás son ventanilla
        es_consultorio = llamado['servicio'] == 'Consulta Médica'
        nombre = llamado['nombre_paciente']
        ventanilla = llamado['ventanilla']
        
        # Formato: Nombre (1 vez), destino completo, nombre (repetido), destino corto
        if es_consultorio:
            texto_anuncio = f"{nombre}, diríjase al consultorio {ventanilla}. {nombre}, consultorio {ventanilla}"
        else:
            servicio = llamado['servicio']
            texto_anuncio = f"{nombre}, diríjase a la ventanilla {ventanilla} de {servicio}. {nombre}, ventanilla {ventanilla}"
        
        return {
            "hay_llamado": True,
            "numero_turno": llamado['numero_turno'],
            "nombre_paciente": llamado['nombre_paciente'],
            "servicio": llamado['servicio'],
            "ventanilla": llamado['ventanilla'],
            "texto_anuncio": texto_anuncio
        }
    
    finally:
        conn.close()


@router.get("/nuevos-llamados")
async def obtener_nuevos_llamados():
    """Obtiene todos los llamados nuevos para anunciar (soporta múltiples llamados simultáneos)"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, numero_turno, nombre_paciente, servicio, ventanilla, fecha_llamado
            FROM llamados
            WHERE mostrado = 0
            ORDER BY fecha_llamado ASC
            LIMIT 3
        """)
        
        llamados = cursor.fetchall()
        
        if not llamados:
            return {"hay_llamados": False, "llamados": []}
        
        # Marcar todos como mostrados
        ids = [llamado['id'] for llamado in llamados]
        placeholders = ','.join('?' * len(ids))
        cursor.execute(f"""
            UPDATE llamados SET mostrado = 1 WHERE id IN ({placeholders})
        """, ids)
        
        conn.commit()
        
        resultado = []
        for llamado in llamados:
            # Determinar si es consultorio médico o ventanilla
            # SOLO "Consulta Médica" es consultorio, los demás son ventanilla
            es_consultorio = llamado['servicio'] == 'Consulta Médica'
            nombre = llamado['nombre_paciente']
            ventanilla = llamado['ventanilla']
            
            # Formato: Nombre (1 vez), destino completo, nombre (repetido), destino corto
            if es_consultorio:
                texto_anuncio = f"{nombre}, diríjase al consultorio {ventanilla}. {nombre}, consultorio {ventanilla}"
            else:
                servicio = llamado['servicio']
                texto_anuncio = f"{nombre}, diríjase a la ventanilla {ventanilla} de {servicio}. {nombre}, ventanilla {ventanilla}"
            
            resultado.append({
                "id": llamado['id'],
                "numero_turno": llamado['numero_turno'],
                "nombre_paciente": llamado['nombre_paciente'],
                "servicio": llamado['servicio'],
                "ventanilla": llamado['ventanilla'],
                "texto_anuncio": texto_anuncio
            })
        
        return {
            "hay_llamados": True,
            "cantidad": len(resultado),
            "llamados": resultado
        }
    
    finally:
        conn.close()


@router.get("/turnos-en-espera", response_model=List[PacienteEnEspera])
async def obtener_turnos_en_espera():
    """Obtiene todos los turnos en espera"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                id, numero_turno, nombre_paciente, servicio, 
                condicion_especial, fecha_registro
            FROM turnos
            WHERE estado = 'espera'
            ORDER BY fecha_registro ASC
        """)
        
        turnos = cursor.fetchall()
        
        resultado = []
        for turno in turnos:
            fecha_registro = datetime.fromisoformat(turno['fecha_registro'])
            tiempo_espera = str(datetime.utcnow() - fecha_registro).split('.')[0]
            
            resultado.append(PacienteEnEspera(
                id=turno['id'],
                numero_turno=turno['numero_turno'],
                nombre_paciente=turno['nombre_paciente'],
                servicio=turno['servicio'],
                condicion_especial=turno['condicion_especial'],
                tiempo_espera=tiempo_espera
            ))
        
        return resultado
    
    finally:
        conn.close()


@router.get("/estadisticas")
async def obtener_estadisticas():
    """Obtiene estadísticas del día"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        fecha_hoy = datetime.now().strftime("%Y-%m-%d")
        
        # Total de turnos del día
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM turnos
            WHERE DATE(fecha_registro) = ?
        """, (fecha_hoy,))
        
        total = cursor.fetchone()['total']
        
        # Turnos por estado
        cursor.execute("""
            SELECT estado, COUNT(*) as cantidad
            FROM turnos
            WHERE DATE(fecha_registro) = ?
            GROUP BY estado
        """, (fecha_hoy,))
        
        estados = cursor.fetchall()
        
        # Turnos por servicio
        cursor.execute("""
            SELECT servicio, COUNT(*) as cantidad
            FROM turnos
            WHERE DATE(fecha_registro) = ?
            GROUP BY servicio
        """, (fecha_hoy,))
        
        servicios = cursor.fetchall()
        
        return {
            "total_turnos": total,
            "por_estado": {estado['estado']: estado['cantidad'] for estado in estados},
            "por_servicio": {servicio['servicio']: servicio['cantidad'] for servicio in servicios}
        }
    
    finally:
        conn.close()


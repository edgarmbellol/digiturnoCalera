"""Rutas para el kiosco de registro de turnos"""
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime

from models.schemas import KioskInput, TurnoResponse
from database.sqlite_db import get_db_connection, generar_numero_turno
from database.sqlserver_db import buscar_paciente_por_documento

router = APIRouter()


@router.post("/registro", response_model=TurnoResponse)
async def registrar_turno(data: KioskInput):
    """Registra un nuevo turno en el sistema"""
    
    # Buscar paciente en SQL Server
    paciente = await buscar_paciente_por_documento(data.documento)
    
    if not paciente:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    
    nombre_paciente = paciente["nombre"]
    
    # Generar número de turno
    numero_turno = generar_numero_turno(data.servicio)
    
    # Guardar en SQLite
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO turnos 
            (numero_turno, documento, nombre_paciente, servicio, condicion_especial, estado)
            VALUES (?, ?, ?, ?, ?, 'espera')
        """, (numero_turno, data.documento, nombre_paciente, data.servicio, data.condicion_especial))
        
        turno_id = cursor.lastrowid
        conn.commit()
        
        # Obtener el turno creado
        cursor.execute("SELECT * FROM turnos WHERE id = ?", (turno_id,))
        turno = cursor.fetchone()
        
        return TurnoResponse(
            id=turno['id'],
            numero_turno=turno['numero_turno'],
            documento=turno['documento'],
            nombre_paciente=turno['nombre_paciente'],
            servicio=turno['servicio'],
            condicion_especial=turno['condicion_especial'],
            estado=turno['estado'],
            fecha_registro=str(turno['fecha_registro'])
        )
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar turno: {str(e)}")
    finally:
        conn.close()


@router.get("/servicios")
async def obtener_servicios():
    """Obtiene la lista de servicios disponibles (dinámico desde configuración)"""
    from database.admin_db import obtener_configuracion_servicios
    
    try:
        config = obtener_configuracion_servicios()
        # Filtrar solo servicios activos y excluir "Consulta Médica" (para médicos)
        servicios = [
            s['servicio'] 
            for s in config 
            if s['activo'] and s['servicio'] != 'Consulta Médica'
        ]
        return {"servicios": servicios}
    except Exception as e:
        # Fallback a configuración estática
        from config import settings
        return {"servicios": settings.SERVICES}


@router.get("/condiciones")
async def obtener_condiciones():
    """Obtiene la lista de condiciones especiales"""
    from config import settings
    return {"condiciones": settings.SPECIAL_CONDITIONS}


@router.get("/buscar-paciente/{documento}")
async def buscar_paciente(documento: str):
    """Busca un paciente por su documento y retorna su nombre"""
    
    # Buscar paciente en SQL Server
    paciente = await buscar_paciente_por_documento(documento)
    
    if not paciente:
        return {
            "encontrado": False,
            "nombre": "Usuario"
        }
    
    return {
        "encontrado": True,
        "nombre": paciente["nombre"]
    }

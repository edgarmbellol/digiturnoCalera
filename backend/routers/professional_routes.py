"""Rutas para profesionales (no médicos)"""
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime

from models.schemas import (
    LoginRequest, LoginResponse, 
    LlamarPacienteRequest, AtenderPacienteRequest,
    PacienteEnEspera
)
from database.sqlite_db import get_db_connection
from database.sqlserver_db import validar_usuario

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login_profesional(data: LoginRequest):
    """Autentica a un profesional"""
    
    # Validar usuario contra SQL Server
    usuario = await validar_usuario(data.codigo_usuario, data.clave)
    
    if not usuario:
        return LoginResponse(
            success=False,
            message="Usuario o contraseña incorrectos"
        )
    
    # Crear sesión en SQLite
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Cerrar sesiones anteriores del mismo usuario
        cursor.execute("""
            UPDATE sesiones_profesionales 
            SET activo = 0, fecha_logout = CURRENT_TIMESTAMP
            WHERE codigo_usuario = ? AND activo = 1
        """, (data.codigo_usuario,))
        
        # Crear nueva sesión
        cursor.execute("""
            INSERT INTO sesiones_profesionales 
            (codigo_usuario, nombre_usuario, servicio, ventanilla)
            VALUES (?, ?, ?, ?)
        """, (data.codigo_usuario, data.codigo_usuario, data.servicio, data.ventanilla))
        
        sesion_id = cursor.lastrowid
        conn.commit()
        
        return LoginResponse(
            success=True,
            message="Login exitoso",
            sesion_id=sesion_id,
            codigo_usuario=data.codigo_usuario,
            nombre_usuario=data.codigo_usuario,
            servicio=data.servicio,
            ventanilla=data.ventanilla
        )
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear sesión: {str(e)}")
    finally:
        conn.close()


@router.get("/turnos/{servicio}", response_model=List[PacienteEnEspera])
async def obtener_turnos_servicio(servicio: str):
    """Obtiene los turnos en espera y llamados para un servicio"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                t.id, t.numero_turno, t.nombre_paciente, t.servicio, 
                t.condicion_especial, t.es_prioritario, t.fecha_registro, 
                t.estado, t.profesional_codigo, t.ventanilla,
                sp.nombre_usuario as profesional_nombre
            FROM turnos t
            LEFT JOIN sesiones_profesionales sp 
                ON t.profesional_codigo = sp.codigo_usuario 
                AND sp.activo = 1
            WHERE t.servicio = ? AND t.estado IN ('espera', 'llamado')
            ORDER BY 
                CASE t.estado
                    WHEN 'llamado' THEN 0
                    WHEN 'espera' THEN 1
                END,
                t.es_prioritario DESC,
                CASE t.condicion_especial
                    WHEN 'Discapacitado' THEN 1
                    WHEN 'Tercera Edad' THEN 2
                    WHEN 'Embarazo' THEN 3
                    ELSE 4
                END,
                t.fecha_registro ASC
        """, (servicio,))
        
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
                es_prioritario=bool(turno['es_prioritario']),
                tiempo_espera=tiempo_espera,
                estado=turno['estado'],
                profesional_codigo=turno['profesional_codigo'],
                ventanilla=turno['ventanilla'],
                profesional_nombre=turno['profesional_nombre'] or turno['profesional_codigo']
            ))
        
        return resultado
    
    finally:
        conn.close()


@router.post("/llamar")
async def llamar_paciente(data: LlamarPacienteRequest):
    """Llama a un paciente"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Actualizar estado del turno
        cursor.execute("""
            UPDATE turnos 
            SET estado = 'llamado', 
                ventanilla = ?, 
                profesional_codigo = ?,
                fecha_llamado = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (data.ventanilla, data.codigo_profesional, data.turno_id))
        
        # Obtener información del turno
        cursor.execute("""
            SELECT numero_turno, nombre_paciente, servicio
            FROM turnos WHERE id = ?
        """, (data.turno_id,))
        
        turno = cursor.fetchone()
        
        if not turno:
            raise HTTPException(status_code=404, detail="Turno no encontrado")
        
        # Registrar en llamados para la pantalla de espera
        cursor.execute("""
            INSERT INTO llamados 
            (turno_id, numero_turno, nombre_paciente, servicio, ventanilla)
            VALUES (?, ?, ?, ?, ?)
        """, (data.turno_id, turno['numero_turno'], turno['nombre_paciente'], 
              turno['servicio'], data.ventanilla))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Paciente llamado exitosamente",
            "turno": {
                "numero_turno": turno['numero_turno'],
                "nombre_paciente": turno['nombre_paciente'],
                "servicio": turno['servicio'],
                "ventanilla": data.ventanilla
            }
        }
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al llamar paciente: {str(e)}")
    finally:
        conn.close()


@router.post("/atender")
async def atender_paciente(data: AtenderPacienteRequest):
    """Marca un paciente como atendido o no responde"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Primero verificar quién está llamando al paciente
        cursor.execute("""
            SELECT profesional_codigo, ventanilla, estado
            FROM turnos
            WHERE id = ?
        """, (data.turno_id,))
        
        turno = cursor.fetchone()
        
        if not turno:
            raise HTTPException(status_code=404, detail="Turno no encontrado")
        
        # Si el paciente está siendo llamado, verificar que el profesional que lo está llamando sea el que intenta atenderlo
        if turno['estado'] == 'llamado' and turno['profesional_codigo']:
            # Validar que solo el profesional que está llamando pueda marcar como atendido/no responde
            if data.codigo_profesional and data.codigo_profesional != turno['profesional_codigo']:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Este paciente está siendo llamado por el profesional {turno['profesional_codigo']} en la ventanilla {turno['ventanilla']}. Solo ese profesional puede marcarlo como atendido o no responde."
                )
        
        if data.estado == "atendido":
            cursor.execute("""
                UPDATE turnos 
                SET estado = 'atendido', 
                    fecha_atencion = CURRENT_TIMESTAMP,
                    observacion = ?
                WHERE id = ?
            """, (data.observacion, data.turno_id))
        
        elif data.estado == "no_responde":
            cursor.execute("""
                UPDATE turnos 
                SET estado = 'no_responde', 
                    rellamado = rellamado + 1,
                    observacion = ?
                WHERE id = ?
            """, (data.observacion, data.turno_id))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Paciente marcado como {data.estado}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al atender paciente: {str(e)}")
    finally:
        conn.close()


@router.get("/rellamados/{servicio}")
async def obtener_rellamados(servicio: str):
    """Obtiene los pacientes que no respondieron"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                id, numero_turno, nombre_paciente, servicio, 
                condicion_especial, es_prioritario, fecha_registro, rellamado
            FROM turnos
            WHERE servicio = ? AND estado = 'no_responde'
            ORDER BY es_prioritario DESC, fecha_llamado DESC
        """, (servicio,))
        
        turnos = cursor.fetchall()
        
        resultado = []
        for turno in turnos:
            fecha_registro = datetime.fromisoformat(turno['fecha_registro'])
            tiempo_espera = str(datetime.utcnow() - fecha_registro).split('.')[0]
            
            resultado.append({
                "id": turno['id'],
                "numero_turno": turno['numero_turno'],
                "nombre_paciente": turno['nombre_paciente'],
                "servicio": turno['servicio'],
                "condicion_especial": turno['condicion_especial'],
                "es_prioritario": bool(turno['es_prioritario']),
                "tiempo_espera": tiempo_espera,
                "rellamado": turno['rellamado']
            })
        
        return resultado
    
    finally:
        conn.close()


@router.post("/logout/{sesion_id}")
async def logout_profesional(sesion_id: int):
    """Cierra sesión de un profesional"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE sesiones_profesionales 
            SET activo = 0, fecha_logout = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (sesion_id,))
        
        conn.commit()
        
        return {"success": True, "message": "Sesión cerrada"}
    
    finally:
        conn.close()


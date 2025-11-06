"""Rutas para médicos"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime

from models.schemas import (
    LoginRequest, LoginResponse, 
    CitaResponse, MarcarFacturadoRequest,
    LlamarPacienteRequest, AtenderPacienteRequest
)
from database.sqlite_db import get_db_connection
from database.sqlserver_db import validar_usuario, obtener_citas_medico

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login_medico(data: LoginRequest):
    """Autentica a un médico"""
    
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
        # Cerrar sesiones anteriores
        cursor.execute("""
            UPDATE sesiones_profesionales 
            SET activo = 0, fecha_logout = CURRENT_TIMESTAMP
            WHERE codigo_usuario = ? AND activo = 1
        """, (data.codigo_usuario,))
        
        # Crear nueva sesión
        cursor.execute("""
            INSERT INTO sesiones_profesionales 
            (codigo_usuario, nombre_usuario, servicio, ventanilla)
            VALUES (?, ?, 'Médico', ?)
        """, (data.codigo_usuario, data.codigo_usuario, data.ventanilla))
        
        sesion_id = cursor.lastrowid
        conn.commit()
        
        return LoginResponse(
            success=True,
            message="Login exitoso",
            sesion_id=sesion_id,
            codigo_usuario=data.codigo_usuario,
            nombre_usuario=data.codigo_usuario,
            servicio="Médico",
            ventanilla=data.ventanilla
        )
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear sesión: {str(e)}")
    finally:
        conn.close()


@router.get("/agenda/{codigo_profesional}", response_model=List[CitaResponse])
async def obtener_agenda(
    codigo_profesional: str, 
    fecha: Optional[str] = None
):
    """Obtiene la agenda de un médico para una fecha específica"""
    
    if not fecha:
        fecha = datetime.now().strftime("%Y-%m-%d")
    
    # Obtener citas desde SQL Server
    citas = await obtener_citas_medico(codigo_profesional, fecha)
    
    if not citas:
        return []
    
    # Verificar cuáles están facturadas y en espera
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        resultado = []
        for cita in citas:
            # Verificar si hay un turno asociado DE CONSULTA MÉDICA y su estado
            # IMPORTANTE: Solo considerar turnos del servicio "Consulta Médica"
            cursor.execute("""
                SELECT estado FROM turnos
                WHERE documento = ? 
                AND servicio = 'Consulta Médica'
                AND estado IN ('espera', 'llamado')
                ORDER BY fecha_registro DESC LIMIT 1
            """, (cita['documento'],))
            
            turno_row = cursor.fetchone()
            estado_turno = turno_row['estado'] if turno_row else None
            
            resultado.append(CitaResponse(
                secuencia=cita['secuencia'],
                fecha=cita['fecha'],
                hora=cita['hora'],
                profesional=cita['profesional'],
                documento=cita['documento'],
                nombre_paciente=cita['nombre_paciente'],
                indicador=cita['indicador'],
                estado_cita=cita['estado_cita'],
                en_espera=False,  # Ya no usamos este campo
                facturado=False,  # Ya no usamos este campo
                estado_turno=estado_turno
            ))
        
        return resultado
    
    finally:
        conn.close()


@router.post("/marcar-facturado")
async def marcar_cita_facturada(data: MarcarFacturadoRequest):
    """Marca una cita como facturada y en espera"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar si ya existe
        cursor.execute("""
            SELECT id FROM citas_facturadas
            WHERE secuencia_cita = ?
        """, (data.secuencia_cita,))
        
        existe = cursor.fetchone()
        
        if existe:
            # Actualizar
            cursor.execute("""
                UPDATE citas_facturadas
                SET en_espera = 1
                WHERE secuencia_cita = ?
            """, (data.secuencia_cita,))
        else:
            # Insertar
            cursor.execute("""
                INSERT INTO citas_facturadas
                (secuencia_cita, documento, en_espera)
                VALUES (?, ?, 1)
            """, (data.secuencia_cita, data.documento))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Cita marcada como facturada"
        }
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        conn.close()


@router.post("/llamar-paciente")
async def llamar_paciente_cita(data: LlamarPacienteRequest):
    """Llama a un paciente desde la agenda - Crea turno automáticamente si no existe"""
    
    from database.sqlite_db import generar_numero_turno
    from database.sqlserver_db import buscar_paciente_por_documento
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # data.turno_id es en realidad la secuencia de la cita
        secuencia_cita = data.turno_id
        
        # Primero, buscar la cita en SQL Server para obtener el documento
        from database.sqlserver_db import get_sqlserver_connection
        sql_conn = get_sqlserver_connection()
        if not sql_conn:
            raise HTTPException(status_code=500, detail="Error conectando a base de datos")
        
        sql_cursor = sql_conn.cursor()
        sql_cursor.execute("""
            SELECT c.Documento, p.Nombre1, p.Nombre2, p.Apellido1, p.Apellido2
            FROM Citas c WITH (NOLOCK)
            LEFT JOIN Pacientes p WITH (NOLOCK) ON c.Documento = p.Documento
            WHERE c.Secuencia = ?
        """, (secuencia_cita,))
        
        cita_row = sql_cursor.fetchone()
        sql_conn.close()
        
        if not cita_row:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
        documento = cita_row.Documento
        
        # Construir nombre completo
        nombres = []
        if cita_row.Nombre1:
            nombres.append(cita_row.Nombre1.strip())
        if cita_row.Nombre2:
            nombres.append(cita_row.Nombre2.strip())
        if cita_row.Apellido1:
            nombres.append(cita_row.Apellido1.strip())
        if cita_row.Apellido2:
            nombres.append(cita_row.Apellido2.strip())
        
        nombre_paciente = " ".join(nombres) if nombres else documento
        
        # Verificar si ya existe un turno activo DE CONSULTA MÉDICA para este paciente HOY
        cursor.execute("""
            SELECT id, numero_turno, estado
            FROM turnos
            WHERE documento = ? 
            AND servicio = 'Consulta Médica'
            AND DATE(fecha_registro) = DATE('now')
            AND estado IN ('espera', 'llamado')
            ORDER BY fecha_registro DESC LIMIT 1
        """, (documento,))
        
        turno_row = cursor.fetchone()
        turno_existente = {
            "existe": bool(turno_row),
            "turno_id": turno_row['id'] if turno_row else None,
            "numero_turno": turno_row['numero_turno'] if turno_row else None,
            "estado": turno_row['estado'] if turno_row else None
        }
        
        # Si ya existe un turno activo DE CONSULTA MÉDICA
        if turno_existente["existe"]:
            turno_id = turno_existente["turno_id"]
            numero_turno = turno_existente["numero_turno"]
            estado_actual = turno_existente["estado"]
            
            print(f"ℹ️ Paciente {documento} ya tiene turno de Consulta Médica: {numero_turno}")
            
            # Si está en espera, cambiarlo a llamado
            if estado_actual == 'espera':
                cursor.execute("""
                    UPDATE turnos 
                    SET estado = 'llamado', 
                        ventanilla = ?, 
                        profesional_codigo = ?,
                        fecha_llamado = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (data.ventanilla, data.codigo_profesional, turno_id))
                
                # Registrar en llamados
                cursor.execute("""
                    INSERT INTO llamados 
                    (turno_id, numero_turno, nombre_paciente, servicio, ventanilla)
                    VALUES (?, ?, ?, 'Consulta Médica', ?)
                """, (turno_id, numero_turno, nombre_paciente, data.ventanilla))
                
                conn.commit()
                
                return {
                    "success": True,
                    "message": "Paciente llamado (turno existente reutilizado)",
                    "turno": {
                        "numero_turno": numero_turno,
                        "nombre_paciente": nombre_paciente,
                        "ventanilla": data.ventanilla
                    }
                }
            else:
                # Ya está en estado llamado
                return {
                    "success": True,
                    "message": "Paciente ya fue llamado",
                    "turno": {
                        "numero_turno": numero_turno,
                        "nombre_paciente": nombre_paciente,
                        "ventanilla": data.ventanilla
                    }
                }
        
        # Si NO existe turno, crear uno nuevo ÚNICO
        numero_turno = generar_numero_turno("Consulta Médica", verificar_unicidad=True)
        print(f"✅ Generando turno único: {numero_turno} para paciente {documento}")
        
        cursor.execute("""
            INSERT INTO turnos 
            (numero_turno, documento, nombre_paciente, servicio, estado, ventanilla, profesional_codigo, fecha_llamado)
            VALUES (?, ?, ?, 'Consulta Médica', 'llamado', ?, ?, CURRENT_TIMESTAMP)
        """, (numero_turno, documento, nombre_paciente, data.ventanilla, data.codigo_profesional))
        
        turno_id = cursor.lastrowid
        
        # Registrar en llamados para la pantalla
        cursor.execute("""
            INSERT INTO llamados 
            (turno_id, numero_turno, nombre_paciente, servicio, ventanilla)
            VALUES (?, ?, ?, 'Consulta Médica', ?)
        """, (turno_id, numero_turno, nombre_paciente, data.ventanilla))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Paciente llamado exitosamente (turno nuevo único)",
            "turno": {
                "numero_turno": numero_turno,
                "nombre_paciente": nombre_paciente,
                "ventanilla": data.ventanilla
            }
        }
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        conn.close()


@router.post("/atender")
async def atender_paciente_cita(data: AtenderPacienteRequest):
    """Marca un paciente como atendido o no responde"""
    
    from database.sqlserver_db import get_sqlserver_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # data.turno_id es en realidad la secuencia de la cita
        secuencia_cita = data.turno_id
        
        # Obtener el documento del paciente desde SQL Server
        sql_conn = get_sqlserver_connection()
        if not sql_conn:
            raise HTTPException(status_code=500, detail="Error conectando a base de datos")
        
        sql_cursor = sql_conn.cursor()
        sql_cursor.execute("""
            SELECT Documento
            FROM Citas WITH (NOLOCK)
            WHERE Secuencia = ?
        """, (secuencia_cita,))
        
        cita_row = sql_cursor.fetchone()
        sql_conn.close()
        
        if not cita_row:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
        documento = cita_row.Documento
        
        # Buscar el turno asociado a este documento SOLO DE CONSULTA MÉDICA
        cursor.execute("""
            SELECT id FROM turnos
            WHERE documento = ? 
            AND servicio = 'Consulta Médica'
            AND estado IN ('espera', 'llamado')
            ORDER BY fecha_registro DESC LIMIT 1
        """, (documento,))
        
        turno = cursor.fetchone()
        
        if not turno:
            # Si no hay turno activo, no hay nada que actualizar
            return {
                "success": True,
                "message": "No hay turno activo para este paciente"
            }
        
        turno_id = turno['id']
        
        # Actualizar el estado del turno
        if data.estado == "atendido":
            cursor.execute("""
                UPDATE turnos 
                SET estado = 'atendido', 
                    fecha_atencion = CURRENT_TIMESTAMP,
                    observacion = ?
                WHERE id = ?
            """, (data.observacion, turno_id))
        elif data.estado == "no_responde":
            cursor.execute("""
                UPDATE turnos 
                SET estado = 'no_responde', 
                    rellamado = rellamado + 1,
                    observacion = ?
                WHERE id = ?
            """, (data.observacion, turno_id))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Paciente marcado como {data.estado}",
            "turno_id": turno_id
        }
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        conn.close()


@router.post("/logout/{sesion_id}")
async def logout_medico(sesion_id: int):
    """Cierra sesión de un médico"""
    
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


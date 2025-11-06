"""Rutas para administración del sistema"""
from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel

from models.schemas import LoginRequest, LoginResponse
from database.sqlite_db import get_db_connection
from database.sqlserver_db import validar_usuario
from database.admin_db import (
    obtener_configuracion_servicios,
    actualizar_ventanillas,
    actualizar_nombre_servicio,
    agregar_servicio,
    eliminar_servicio,
    obtener_estadisticas_completas
)

router = APIRouter()


class ConfiguracionServicio(BaseModel):
    id: int
    servicio: str
    num_ventanillas: int
    activo: bool


class ActualizarVentanillasRequest(BaseModel):
    servicio: str
    num_ventanillas: int


class RenombrarServicioRequest(BaseModel):
    servicio_actual: str
    servicio_nuevo: str


class AgregarServicioRequest(BaseModel):
    nombre: str
    num_ventanillas: int


@router.post("/login", response_model=LoginResponse)
async def login_admin(data: LoginRequest):
    """Autentica a un administrador"""
    
    # Validar usuario contra SQL Server
    usuario = await validar_usuario(data.codigo_usuario, data.clave)
    
    if not usuario:
        return LoginResponse(
            success=False,
            message="Usuario o contraseña incorrectos"
        )
    
    # Crear sesión de administrador
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Cerrar sesiones anteriores
        cursor.execute("""
            UPDATE sesiones_admin 
            SET activo = 0, fecha_logout = CURRENT_TIMESTAMP
            WHERE codigo_usuario = ? AND activo = 1
        """, (data.codigo_usuario,))
        
        # Crear nueva sesión
        cursor.execute("""
            INSERT INTO sesiones_admin 
            (codigo_usuario, nombre_usuario)
            VALUES (?, ?)
        """, (data.codigo_usuario, data.codigo_usuario))
        
        sesion_id = cursor.lastrowid
        conn.commit()
        
        return LoginResponse(
            success=True,
            message="Login exitoso",
            sesion_id=sesion_id,
            codigo_usuario=data.codigo_usuario,
            nombre_usuario=data.codigo_usuario,
            servicio="Administrador",
            ventanilla=0
        )
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear sesión: {str(e)}")
    finally:
        conn.close()


@router.get("/configuracion", response_model=List[ConfiguracionServicio])
async def obtener_configuracion():
    """Obtiene la configuración actual de servicios"""
    
    try:
        servicios = obtener_configuracion_servicios()
        
        return [
            ConfiguracionServicio(
                id=s['id'],
                servicio=s['servicio'],
                num_ventanillas=s['num_ventanillas'],
                activo=s['activo']
            )
            for s in servicios
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/actualizar-ventanillas")
async def actualizar_configuracion_ventanillas(data: ActualizarVentanillasRequest):
    """Actualiza el número de ventanillas para un servicio"""
    
    if data.num_ventanillas < 1:
        raise HTTPException(status_code=400, detail="El número de ventanillas debe ser mayor a 0")
    
    if data.num_ventanillas > 20:
        raise HTTPException(status_code=400, detail="El número máximo de ventanillas es 20")
    
    resultado = actualizar_ventanillas(data.servicio, data.num_ventanillas)
    
    if resultado['success']:
        return resultado
    else:
        raise HTTPException(status_code=500, detail=resultado['message'])


@router.get("/estadisticas")
async def obtener_estadisticas_admin():
    """Obtiene estadísticas completas del sistema"""
    
    try:
        estadisticas = obtener_estadisticas_completas()
        return estadisticas
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/pacientes-en-espera")
async def obtener_pacientes_en_espera():
    """Obtiene todos los pacientes en espera ordenados por tiempo de espera"""
    from datetime import datetime
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                id,
                numero_turno,
                documento,
                nombre_paciente,
                servicio,
                condicion_especial,
                ventanilla,
                estado,
                fecha_registro,
                fecha_llamado,
                profesional_codigo
            FROM turnos
            WHERE estado IN ('espera', 'llamado')
            ORDER BY fecha_registro ASC
        """)
        
        turnos = cursor.fetchall()
        
        resultado = []
        for turno in turnos:
            # Parsear la fecha correctamente desde SQLite (que usa UTC)
            fecha_registro_str = turno['fecha_registro']
            
            # SQLite devuelve fechas en UTC, debemos usar utcnow() para comparar
            try:
                # Intentar parsear con milisegundos
                if '.' in fecha_registro_str:
                    fecha_registro = datetime.strptime(fecha_registro_str, '%Y-%m-%d %H:%M:%S.%f')
                else:
                    fecha_registro = datetime.strptime(fecha_registro_str, '%Y-%m-%d %H:%M:%S')
            except:
                # Fallback a fromisoformat
                fecha_registro = datetime.fromisoformat(fecha_registro_str.replace(' ', 'T'))
            
            # IMPORTANTE: Usar utcnow() porque SQLite guarda en UTC
            tiempo_espera_segundos = (datetime.utcnow() - fecha_registro).total_seconds()
            tiempo_espera_minutos = int(tiempo_espera_segundos / 60)
            
            # Debug: Verificar cálculo
            print(f"⏰ {turno['numero_turno']}: Registro={fecha_registro_str} (UTC), Ahora={datetime.utcnow()} (UTC), Diff={tiempo_espera_minutos}min")
            
            # Calcular nivel de alerta
            if tiempo_espera_minutos >= 60:
                nivel_alerta = "critico"
            elif tiempo_espera_minutos >= 30:
                nivel_alerta = "alto"
            elif tiempo_espera_minutos >= 15:
                nivel_alerta = "medio"
            else:
                nivel_alerta = "normal"
            
            # Debug log
            print(f"🔍 Turno {turno['numero_turno']}: {tiempo_espera_minutos} min → Nivel: {nivel_alerta}")
            
            # Formatear tiempo de espera
            horas = tiempo_espera_minutos // 60
            minutos = tiempo_espera_minutos % 60
            
            if horas > 0:
                tiempo_formato = f"{horas}h {minutos}min"
            else:
                tiempo_formato = f"{minutos}min"
            
            resultado.append({
                "id": turno['id'],
                "numero_turno": turno['numero_turno'],
                "documento": turno['documento'],
                "nombre_paciente": turno['nombre_paciente'],
                "servicio": turno['servicio'],
                "condicion_especial": turno['condicion_especial'],
                "ventanilla": turno['ventanilla'],
                "estado": turno['estado'],
                "profesional_codigo": turno['profesional_codigo'],
                "fecha_registro": str(turno['fecha_registro']),
                "fecha_llamado": str(turno['fecha_llamado']) if turno['fecha_llamado'] else None,
                "tiempo_espera_minutos": tiempo_espera_minutos,
                "tiempo_espera_formato": tiempo_formato,
                "nivel_alerta": nivel_alerta
            })
        
        return resultado
    
    finally:
        conn.close()


@router.get("/observaciones")
async def obtener_observaciones():
    """Obtiene todas las observaciones registradas por los profesionales"""
    from datetime import datetime
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                id,
                numero_turno,
                documento,
                nombre_paciente,
                servicio,
                ventanilla,
                estado,
                profesional_codigo,
                observacion,
                fecha_registro,
                fecha_atencion
            FROM turnos
            WHERE observacion IS NOT NULL AND observacion != ''
            ORDER BY fecha_atencion DESC, fecha_registro DESC
        """)
        
        turnos = cursor.fetchall()
        
        resultado = []
        for turno in turnos:
            resultado.append({
                "id": turno['id'],
                "numero_turno": turno['numero_turno'],
                "documento": turno['documento'],
                "nombre_paciente": turno['nombre_paciente'],
                "servicio": turno['servicio'],
                "ventanilla": turno['ventanilla'],
                "estado": turno['estado'],
                "profesional_codigo": turno['profesional_codigo'],
                "observacion": turno['observacion'],
                "fecha_registro": str(turno['fecha_registro']),
                "fecha_atencion": str(turno['fecha_atencion']) if turno['fecha_atencion'] else None
            })
        
        return resultado
    
    finally:
        conn.close()


@router.get("/sesiones-activas")
async def obtener_sesiones_activas():
    """Obtiene todas las sesiones activas (profesionales y médicos)"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                codigo_usuario,
                nombre_usuario,
                servicio,
                ventanilla,
                fecha_login
            FROM sesiones_profesionales
            WHERE activo = 1
            ORDER BY fecha_login DESC
        """)
        
        sesiones = cursor.fetchall()
        
        resultado = []
        for sesion in sesiones:
            resultado.append({
                "codigo_usuario": sesion['codigo_usuario'],
                "nombre_usuario": sesion['nombre_usuario'],
                "servicio": sesion['servicio'],
                "ventanilla": sesion['ventanilla'],
                "fecha_login": str(sesion['fecha_login'])
            })
        
        return resultado
    
    finally:
        conn.close()


@router.post("/renombrar-servicio")
async def renombrar_servicio(data: RenombrarServicioRequest):
    """Renombra un servicio existente"""
    
    if not data.servicio_nuevo or len(data.servicio_nuevo.strip()) < 3:
        raise HTTPException(status_code=400, detail="El nombre del servicio debe tener al menos 3 caracteres")
    
    resultado = actualizar_nombre_servicio(data.servicio_actual, data.servicio_nuevo.strip())
    
    if resultado['success']:
        return resultado
    else:
        raise HTTPException(status_code=400, detail=resultado['message'])


@router.post("/agregar-servicio")
async def crear_servicio(data: AgregarServicioRequest):
    """Agrega un nuevo servicio al sistema"""
    
    if not data.nombre or len(data.nombre.strip()) < 3:
        raise HTTPException(status_code=400, detail="El nombre del servicio debe tener al menos 3 caracteres")
    
    if data.num_ventanillas < 1 or data.num_ventanillas > 20:
        raise HTTPException(status_code=400, detail="El número de ventanillas debe estar entre 1 y 20")
    
    resultado = agregar_servicio(data.nombre.strip(), data.num_ventanillas)
    
    if resultado['success']:
        return resultado
    else:
        raise HTTPException(status_code=400, detail=resultado['message'])


@router.post("/eliminar-servicio/{servicio}")
async def desactivar_servicio(servicio: str):
    """Desactiva un servicio del sistema"""
    
    resultado = eliminar_servicio(servicio)
    
    if resultado['success']:
        return resultado
    else:
        raise HTTPException(status_code=400, detail=resultado['message'])


@router.post("/logout/{sesion_id}")
async def logout_admin(sesion_id: int):
    """Cierra sesión de administrador"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE sesiones_admin 
            SET activo = 0, fecha_logout = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (sesion_id,))
        
        conn.commit()
        
        return {"success": True, "message": "Sesión cerrada"}
    
    finally:
        conn.close()


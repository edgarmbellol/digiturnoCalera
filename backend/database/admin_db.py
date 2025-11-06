"""Funciones de base de datos para administración"""
from database.sqlite_db import get_db_connection


def init_admin_tables():
    """Inicializa tablas de configuración administrativa"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tabla de configuración de ventanillas y consultorios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS configuracion_servicios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            servicio TEXT NOT NULL UNIQUE,
            num_ventanillas INTEGER NOT NULL,
            activo INTEGER DEFAULT 1,
            fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insertar configuración por defecto si no existe
    cursor.execute("SELECT COUNT(*) as count FROM configuracion_servicios")
    if cursor.fetchone()['count'] == 0:
        servicios_default = [
            ('Citas Médicas', 2),
            ('Facturación', 3),
            ('Famisanar', 1),
            ('Nueva EPS', 1),
            ('Consulta Médica', 5)  # Consultorios de médicos
        ]
        
        cursor.executemany("""
            INSERT INTO configuracion_servicios (servicio, num_ventanillas)
            VALUES (?, ?)
        """, servicios_default)
    
    # Tabla de sesiones de administradores
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sesiones_admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_usuario TEXT NOT NULL,
            nombre_usuario TEXT NOT NULL,
            fecha_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_logout TIMESTAMP,
            activo INTEGER DEFAULT 1
        )
    """)
    
    conn.commit()
    conn.close()
    
    print("✓ Tablas de administración inicializadas")


def obtener_configuracion_servicios():
    """Obtiene la configuración actual de servicios y ventanillas"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, servicio, num_ventanillas, activo
            FROM configuracion_servicios
            ORDER BY 
                CASE servicio
                    WHEN 'Citas Médicas' THEN 1
                    WHEN 'Facturación' THEN 2
                    WHEN 'Famisanar' THEN 3
                    WHEN 'Nueva EPS' THEN 4
                    WHEN 'Consulta Médica' THEN 5
                    ELSE 6
                END
        """)
        
        servicios = cursor.fetchall()
        
        resultado = []
        for servicio in servicios:
            resultado.append({
                "id": servicio['id'],
                "servicio": servicio['servicio'],
                "num_ventanillas": servicio['num_ventanillas'],
                "activo": bool(servicio['activo'])
            })
        
        return resultado
    
    finally:
        conn.close()


def actualizar_ventanillas(servicio: str, num_ventanillas: int):
    """Actualiza el número de ventanillas/consultorios para un servicio"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE configuracion_servicios
            SET num_ventanillas = ?,
                fecha_modificacion = CURRENT_TIMESTAMP
            WHERE servicio = ?
        """, (num_ventanillas, servicio))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Configuración actualizada: {servicio} ahora tiene {num_ventanillas} ventanillas/consultorios"
        }
    
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Error al actualizar: {str(e)}"
        }
    
    finally:
        conn.close()


def actualizar_nombre_servicio(servicio_actual: str, servicio_nuevo: str):
    """Actualiza el nombre de un servicio"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar que el nuevo nombre no exista
        cursor.execute("""
            SELECT COUNT(*) as count FROM configuracion_servicios
            WHERE servicio = ?
        """, (servicio_nuevo,))
        
        if cursor.fetchone()['count'] > 0:
            return {
                "success": False,
                "message": "Ya existe un servicio con ese nombre"
            }
        
        # Actualizar nombre en configuración
        cursor.execute("""
            UPDATE configuracion_servicios
            SET servicio = ?,
                fecha_modificacion = CURRENT_TIMESTAMP
            WHERE servicio = ?
        """, (servicio_nuevo, servicio_actual))
        
        # Actualizar nombre en turnos existentes
        cursor.execute("""
            UPDATE turnos
            SET servicio = ?
            WHERE servicio = ?
        """, (servicio_nuevo, servicio_actual))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Servicio renombrado de '{servicio_actual}' a '{servicio_nuevo}'"
        }
    
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Error al renombrar: {str(e)}"
        }
    
    finally:
        conn.close()


def agregar_servicio(nombre: str, num_ventanillas: int):
    """Agrega un nuevo servicio al sistema"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO configuracion_servicios (servicio, num_ventanillas)
            VALUES (?, ?)
        """, (nombre, num_ventanillas))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Servicio '{nombre}' agregado exitosamente con {num_ventanillas} ventanillas"
        }
    
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Error al agregar servicio: {str(e)}"
        }
    
    finally:
        conn.close()


def eliminar_servicio(servicio: str):
    """Desactiva un servicio (no lo elimina, solo lo oculta)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # No permitir eliminar servicios principales
        servicios_protegidos = ['Citas Médicas', 'Consulta Médica']
        if servicio in servicios_protegidos:
            return {
                "success": False,
                "message": f"No se puede eliminar el servicio '{servicio}' (servicio protegido)"
            }
        
        cursor.execute("""
            UPDATE configuracion_servicios
            SET activo = 0,
                fecha_modificacion = CURRENT_TIMESTAMP
            WHERE servicio = ?
        """, (servicio,))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Servicio '{servicio}' desactivado"
        }
    
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Error al eliminar: {str(e)}"
        }
    
    finally:
        conn.close()


def obtener_estadisticas_completas():
    """Obtiene estadísticas completas del sistema"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        fecha_hoy = cursor.execute("SELECT DATE('now')").fetchone()[0]
        
        # Turnos totales del día
        cursor.execute("""
            SELECT COUNT(*) as total FROM turnos
            WHERE DATE(fecha_registro) = ?
        """, (fecha_hoy,))
        total_turnos = cursor.fetchone()['total']
        
        # Turnos por estado
        cursor.execute("""
            SELECT estado, COUNT(*) as cantidad
            FROM turnos
            WHERE DATE(fecha_registro) = ?
            GROUP BY estado
        """, (fecha_hoy,))
        por_estado = {row['estado']: row['cantidad'] for row in cursor.fetchall()}
        
        # Turnos por servicio
        cursor.execute("""
            SELECT servicio, COUNT(*) as cantidad
            FROM turnos
            WHERE DATE(fecha_registro) = ?
            GROUP BY servicio
        """, (fecha_hoy,))
        por_servicio = {row['servicio']: row['cantidad'] for row in cursor.fetchall()}
        
        # Tiempo promedio de espera
        cursor.execute("""
            SELECT AVG(
                (JULIANDAY(fecha_llamado) - JULIANDAY(fecha_registro)) * 24 * 60
            ) as promedio_minutos
            FROM turnos
            WHERE DATE(fecha_registro) = ?
            AND fecha_llamado IS NOT NULL
        """, (fecha_hoy,))
        promedio_espera = cursor.fetchone()['promedio_minutos'] or 0
        
        # Turnos atendidos vs no responde
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN estado = 'atendido' THEN 1 ELSE 0 END) as atendidos,
                SUM(CASE WHEN estado = 'no_responde' THEN 1 ELSE 0 END) as no_responde
            FROM turnos
            WHERE DATE(fecha_registro) = ?
        """, (fecha_hoy,))
        atencion = cursor.fetchone()
        
        return {
            "fecha": fecha_hoy,
            "total_turnos": total_turnos,
            "por_estado": por_estado,
            "por_servicio": por_servicio,
            "promedio_espera_minutos": round(promedio_espera, 1),
            "atendidos": atencion['atendidos'] or 0,
            "no_responde": atencion['no_responde'] or 0
        }
    
    finally:
        conn.close()


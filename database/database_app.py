# app/database.py
# En este archivo se pasaran las consultas a la base de datos
import pyodbc
from datetime import datetime
from config.config_app import SQL_SERVER_APLICACION, SQL_DATABASE_APLICACION, SQL_USERNAME_APLICACION, SQL_PASSWORD_APLICACION

def obtener_conexion():
    conn_str = (
        f'DRIVER={{SQL Server}};'
        f'SERVER={SQL_SERVER_APLICACION};'
        f'DATABASE={SQL_DATABASE_APLICACION};'
        f'UID={SQL_USERNAME_APLICACION};'
        f'PWD={SQL_PASSWORD_APLICACION};'
    )
    return pyodbc.connect(conn_str)

def crear_tabla_turnos():
    """
    Crea la tabla tabla_digiturnos en la base de datos APLICACION si no existe
    """
    conn = obtener_conexion()
    try:
        with conn.cursor() as cursor:
            # Verificar si la tabla existe
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tabla_digiturnos')
                BEGIN
                    CREATE TABLE tabla_digiturnos (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        NumeroTurno VARCHAR(10) NOT NULL,
                        TipoServicio VARCHAR(20) NOT NULL,
                        Documento VARCHAR(20) NOT NULL,
                        Nombre VARCHAR(100),
                        FechaCreacion DATETIME NOT NULL,
                        Estado VARCHAR(20) NOT NULL
                    )
                END
            """)
            conn.commit()
    except Exception as e:
        print(f"Error al crear tabla tabla_digiturnos: {e}")
        conn.rollback()
    finally:
        conn.close()

def generar_turno(tipo_servicio, documento, nombre=None):
    """
    Genera un nuevo turno para el servicio especificado
    """
    # Asegurarse de que la tabla existe
    crear_tabla_turnos()
    
    conn = obtener_conexion()
    try:
        with conn.cursor() as cursor:
            # Obtener el último turno del día para este servicio
            fecha_actual = datetime.now().strftime('%Y-%m-%d')
            
            # Definir prefijos para cada servicio
            prefijos = {
                'citas': 'CM',
                'facturacion': 'FA',
                'famisanar': 'FM',
                'sanitas': 'SA'
            }
            
            prefijo = prefijos.get(tipo_servicio, 'XX')
            
            # Consultar el último turno
            query = """
                SELECT TOP 1 NumeroTurno 
                FROM tabla_digiturnos 
                WHERE TipoServicio = ? 
                AND CONVERT(date, FechaCreacion) = CONVERT(date, GETDATE())
                ORDER BY NumeroTurno DESC
            """
            cursor.execute(query, (tipo_servicio,))
            row = cursor.fetchone()
            
            # Generar nuevo número de turno
            if row:
                ultimo_numero = int(row.NumeroTurno[2:])  # Extraer el número después del prefijo
                nuevo_numero = ultimo_numero + 1
            else:
                nuevo_numero = 1
            
            # Formatear el número de turno (ejemplo: CM001)
            numero_turno = f"{prefijo}{nuevo_numero:03d}"
            
            # Insertar el nuevo turno
            insert_query = """
                INSERT INTO tabla_digiturnos (NumeroTurno, TipoServicio, Documento, Nombre, FechaCreacion, Estado)
                VALUES (?, ?, ?, ?, GETDATE(), 'Pendiente')
            """
            cursor.execute(insert_query, (numero_turno, tipo_servicio, documento, nombre))
            conn.commit()
            
            return {
                'numero_turno': numero_turno,
                'tipo_servicio': tipo_servicio,
                'documento': documento,
                'nombre': nombre
            }
            
    except Exception as e:
        print(f"Error al generar turno: {e}")
        conn.rollback()
        return {'error': str(e)}
    finally:
        conn.close()

def obtener_turnos_espera(tipo_servicio):
    """
    Obtiene los turnos en espera para un tipo de servicio específico
    """
    conn = obtener_conexion()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT NumeroTurno, Documento, Nombre, FechaCreacion
                FROM tabla_digiturnos
                WHERE TipoServicio = ?
                AND Estado = 'Pendiente'
                AND CONVERT(date, FechaCreacion) = CONVERT(date, GETDATE())
                ORDER BY FechaCreacion ASC
            """
            cursor.execute(query, (tipo_servicio,))
            turnos = []
            for row in cursor.fetchall():
                turnos.append({
                    'numero_turno': row.NumeroTurno,
                    'documento': row.Documento,
                    'nombre': row.Nombre,
                    'fecha_creacion': row.FechaCreacion
                })
            return turnos
    except Exception as e:
        print(f"Error al obtener turnos en espera: {e}")
        return []
    finally:
        conn.close()

def llamar_turno(numero_turno, documento, nombre):
    """
    Marca un turno como atendido
    """
    conn = obtener_conexion()
    try:
        with conn.cursor() as cursor:
            query = """
                UPDATE tabla_digiturnos
                SET Estado = 'Atendido'
                WHERE NumeroTurno = ?
                AND Documento = ?
                AND Estado = 'Pendiente'
            """
            cursor.execute(query, (numero_turno, documento))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Error al llamar turno: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


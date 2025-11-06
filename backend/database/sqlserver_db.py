"""Conexión a SQL Server - Solo lectura"""
import pyodbc
from typing import Optional, Dict, Any
from config import settings


def detectar_driver_sql_server():
    """Detecta automáticamente el mejor driver SQL Server disponible"""
    drivers_disponibles = pyodbc.drivers()
    
    # Prioridad de drivers (del más nuevo al más antiguo)
    drivers_preferidos = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "ODBC Driver 13 for SQL Server",
        "ODBC Driver 11 for SQL Server",
        "SQL Server Native Client 11.0",
        "SQL Server Native Client 10.0",
        "SQL Server"
    ]
    
    for driver in drivers_preferidos:
        if driver in drivers_disponibles:
            return driver
    
    # Si no encuentra ninguno específico, buscar cualquiera con "SQL Server"
    for driver in drivers_disponibles:
        if "SQL Server" in driver:
            return driver
    
    return None


def get_sqlserver_connection():
    """Obtiene conexión a SQL Server de solo lectura"""
    # Intentar con el driver configurado primero
    driver = settings.SQL_DRIVER
    
    # Si el driver configurado no funciona, detectar automáticamente
    if driver not in pyodbc.drivers():
        print(f"⚠️  Driver configurado '{driver}' no encontrado")
        driver_detectado = detectar_driver_sql_server()
        
        if driver_detectado:
            print(f"✅ Usando driver detectado: '{driver_detectado}'")
            driver = driver_detectado
        else:
            print("❌ No se encontró ningún driver ODBC para SQL Server")
            print("Por favor instale uno desde:")
            print("https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server")
            return None
    
    connection_string = (
        f"DRIVER={{{driver}}};"
        f"SERVER={settings.SQL_SERVER};"
        f"DATABASE={settings.SQL_DATABASE};"
        f"UID={settings.SQL_USERNAME};"
        f"PWD={settings.SQL_PASSWORD};"
        "ApplicationIntent=ReadOnly;"  # Solo lectura
        "Connection Timeout=5;"
    )
    
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        print(f"❌ Error conectando a SQL Server: {e}")
        print(f"   Driver usado: {driver}")
        print(f"   Servidor: {settings.SQL_SERVER}")
        print(f"   Base de datos: {settings.SQL_DATABASE}")
        return None


async def buscar_paciente_por_documento(documento: str) -> Optional[Dict[str, Any]]:
    """Busca un paciente en la base de datos de SQL Server"""
    conn = get_sqlserver_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT TOP 1
                Nombre1, Nombre2, Apellido1, Apellido2
            FROM Pacientes WITH (NOLOCK)
            WHERE Documento = ?
        """
        
        cursor.execute(query, (documento,))
        row = cursor.fetchone()
        
        if row:
            # Construir nombre completo
            nombres = []
            if row.Nombre1:
                nombres.append(row.Nombre1.strip())
            if row.Nombre2:
                nombres.append(row.Nombre2.strip())
            if row.Apellido1:
                nombres.append(row.Apellido1.strip())
            if row.Apellido2:
                nombres.append(row.Apellido2.strip())
            
            nombre_completo = " ".join(nombres)
            
            return {
                "documento": documento,
                "nombre": nombre_completo,
                "existe": True
            }
        
        return {
            "documento": documento,
            "nombre": documento,  # Si no existe, usar el documento como nombre
            "existe": False
        }
    
    except Exception as e:
        print(f"Error buscando paciente: {e}")
        return None
    finally:
        conn.close()


async def validar_usuario(codigo_usuario: str, clave: str) -> Optional[Dict[str, Any]]:
    """Valida un usuario contra la base de datos de SQL Server"""
    conn = get_sqlserver_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT TOP 1
                CodUsuario, Clave, Aplicacion
            FROM Usuarios WITH (NOLOCK)
            WHERE CodUsuario = ? AND Aplicacion LIKE '%10%'
        """
        
        cursor.execute(query, (codigo_usuario,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        # Desencriptar la clave (restar 2 caracteres ASCII)
        clave_desencriptada = ""
        for char in row.Clave:
            clave_desencriptada += chr(ord(char) - 2)
        
        # Verificar si la clave coincide
        if clave == clave_desencriptada:
            return {
                "codigo_usuario": row.CodUsuario,
                "valido": True
            }
        
        return None
    
    except Exception as e:
        print(f"Error validando usuario: {e}")
        return None
    finally:
        conn.close()


async def obtener_citas_medico(codigo_profesional: str, fecha: str) -> list:
    """Obtiene las citas de un médico para una fecha específica"""
    conn = get_sqlserver_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT 
                c.Secuencia,
                c.Fecha,
                c.Hora,
                c.Prof,
                c.Documento,
                c.Indicador,
                p.Nombre1,
                p.Nombre2,
                p.Apellido1,
                p.Apellido2
            FROM Citas c WITH (NOLOCK)
            LEFT JOIN Pacientes p WITH (NOLOCK) ON c.Documento = p.Documento
            WHERE c.Prof = ? 
            AND CONVERT(DATE, c.Fecha) = ?
            ORDER BY c.Hora
        """
        
        cursor.execute(query, (codigo_profesional, fecha))
        rows = cursor.fetchall()
        
        citas = []
        for row in rows:
            # Construir nombre completo
            nombres = []
            if row.Nombre1:
                nombres.append(row.Nombre1.strip())
            if row.Nombre2:
                nombres.append(row.Nombre2.strip())
            if row.Apellido1:
                nombres.append(row.Apellido1.strip())
            if row.Apellido2:
                nombres.append(row.Apellido2.strip())
            
            nombre_completo = " ".join(nombres) if nombres else row.Documento
            
            citas.append({
                "secuencia": row.Secuencia,
                "fecha": str(row.Fecha),
                "hora": str(row.Hora),
                "profesional": row.Prof,
                "documento": row.Documento,
                "nombre_paciente": nombre_completo,
                "indicador": row.Indicador,
                "estado_cita": "Cerrada" if row.Indicador else "Abierta"
            })
        
        return citas
    
    except Exception as e:
        print(f"Error obteniendo citas: {e}")
        return []
    finally:
        conn.close()


async def buscar_paciente_por_nombre_o_documento(busqueda: str) -> list:
    """Busca pacientes por nombre o documento"""
    conn = get_sqlserver_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT TOP 20
                Documento,
                Nombre1,
                Nombre2,
                Apellido1,
                Apellido2
            FROM Pacientes WITH (NOLOCK)
            WHERE Documento LIKE ? 
            OR Nombre1 LIKE ? 
            OR Apellido1 LIKE ?
        """
        
        busqueda_param = f"%{busqueda}%"
        cursor.execute(query, (busqueda_param, busqueda_param, busqueda_param))
        rows = cursor.fetchall()
        
        pacientes = []
        for row in rows:
            nombres = []
            if row.Nombre1:
                nombres.append(row.Nombre1.strip())
            if row.Nombre2:
                nombres.append(row.Nombre2.strip())
            if row.Apellido1:
                nombres.append(row.Apellido1.strip())
            if row.Apellido2:
                nombres.append(row.Apellido2.strip())
            
            pacientes.append({
                "documento": row.Documento,
                "nombre": " ".join(nombres)
            })
        
        return pacientes
    
    except Exception as e:
        print(f"Error buscando pacientes: {e}")
        return []
    finally:
        conn.close()


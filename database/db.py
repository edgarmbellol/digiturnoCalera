# app/database.py
# En este archivo se pasaran las consultas a la base de datos
import pyodbc
from config.config import SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD
from datetime import datetime

def obtener_conexion():
    conn_str = (
        f'DRIVER={{SQL Server}};'
        f'SERVER={SQL_SERVER};'
        f'DATABASE={SQL_DATABASE};'
        f'UID={SQL_USERNAME};'
        f'PWD={SQL_PASSWORD};'
    )
    return pyodbc.connect(conn_str)


# FUNCIONES PARA CONEXION CON INVETARIOS URGENCIAS
def validar_usuario(usuario, clave):
    conn = None
    clave = clave.upper()
    try:
        conn = obtener_conexion()
        cursor = conn.cursor()
        cursor.execute("EXEC sp_ObtenerUsuario ?", (usuario,))
        row = cursor.fetchone()
        contra = ''
        print(row)
        
        if row is None:
            valor = "Error"
        else:
            for car in row[1]:
                c = ord(car) - 2
                contra = contra + chr(c)
            contra = contra.upper()
            if contra == clave:
                valor = row[2]
            else:
                valor = "Error"
        return valor
    finally:
        if conn:
            conn.close()  # Asegurarse de cerrar la conexión en todo caso

def verificar_paciente(documento):
    """
    Verifica si un paciente existe en la base de datos y retorna sus datos
    """
    conn = obtener_conexion()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    Documento,
                    Nombre1,
                    Nombre2,
                    Apellido1,
                    Apellido2
                FROM Pacientes 
                WHERE Documento = ?
            """
            cursor.execute(query, (documento,))
            row = cursor.fetchone()
            
            if row:
                nombre_completo = ' '.join(filter(None, [
                    row.Nombre1,
                    row.Nombre2,
                    row.Apellido1,
                    row.Apellido2
                ]))
                
                return {
                    'existe': True,
                    'documento': row.Documento,
                    'nombre_completo': nombre_completo
                }
            return {'existe': False}
            
    except Exception as e:
        print(f"Error al verificar paciente: {e}")
        return {'existe': False, 'error': str(e)}
    finally:
        conn.close()




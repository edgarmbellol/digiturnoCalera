"""Gestión de base de datos SQLite local"""
import sqlite3
from datetime import datetime
from typing import Optional
from config import settings


def get_db_connection():
    """Obtiene conexión a SQLite"""
    conn = sqlite3.connect(settings.SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inicializa la base de datos SQLite"""
    from database.admin_db import init_admin_tables
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tabla de turnos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS turnos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_turno TEXT NOT NULL,
            documento TEXT NOT NULL,
            nombre_paciente TEXT NOT NULL,
            servicio TEXT NOT NULL,
            condicion_especial TEXT,
            es_prioritario INTEGER DEFAULT 0,
            ventanilla INTEGER,
            estado TEXT DEFAULT 'espera',
            profesional_codigo TEXT,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_llamado TIMESTAMP,
            fecha_atencion TIMESTAMP,
            observacion TEXT,
            rellamado INTEGER DEFAULT 0
        )
    """)
    
    # Tabla de llamados para pantalla de espera
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS llamados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            turno_id INTEGER NOT NULL,
            numero_turno TEXT NOT NULL,
            nombre_paciente TEXT NOT NULL,
            servicio TEXT NOT NULL,
            ventanilla INTEGER NOT NULL,
            fecha_llamado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            mostrado INTEGER DEFAULT 0,
            FOREIGN KEY (turno_id) REFERENCES turnos (id)
        )
    """)
    
    # Tabla de sesiones de profesionales
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sesiones_profesionales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_usuario TEXT NOT NULL,
            nombre_usuario TEXT NOT NULL,
            servicio TEXT NOT NULL,
            ventanilla INTEGER NOT NULL,
            fecha_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_logout TIMESTAMP,
            activo INTEGER DEFAULT 1
        )
    """)
    
    # Tabla de citas facturadas (estado de pacientes para médicos)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS citas_facturadas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            secuencia_cita INTEGER NOT NULL UNIQUE,
            documento TEXT NOT NULL,
            fecha_facturacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            en_espera INTEGER DEFAULT 1
        )
    """)
    
    # Índices para optimización
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_turnos_servicio ON turnos(servicio)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_llamados_mostrado ON llamados(mostrado)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_citas_facturadas_secuencia ON citas_facturadas(secuencia_cita)")
    
    conn.commit()
    conn.close()
    
    # Inicializar tablas de administración
    init_admin_tables()
    
    print("✓ Base de datos SQLite inicializada correctamente")


def generar_numero_turno(servicio: str, verificar_unicidad: bool = True) -> str:
    """Genera el siguiente número de turno ÚNICO para un servicio"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Obtener el prefijo del servicio (primeras 2 letras en mayúscula)
    prefijos_fijos = {
        "Citas Médicas": "CM",
        "Consulta Médica": "MD",
        "Facturación": "FA",
        "Famisanar": "FS",
        "Nueva EPS": "NE"
    }
    
    # Si el servicio tiene prefijo fijo, usarlo
    if servicio in prefijos_fijos:
        prefijo = prefijos_fijos[servicio]
    else:
        # Generar prefijo automáticamente de las primeras letras
        palabras = servicio.split()
        if len(palabras) >= 2:
            # Tomar primera letra de las dos primeras palabras
            prefijo = (palabras[0][0] + palabras[1][0]).upper()
        else:
            # Tomar las dos primeras letras del nombre
            prefijo = servicio[:2].upper()
        
        # Asegurar que sea de exactamente 2 caracteres
        prefijo = (prefijo + "XX")[:2]
    
    # Obtener el último número para este servicio (sin filtro de fecha)
    # Esto asegura que siempre incrementemos correctamente
    cursor.execute("""
        SELECT numero_turno FROM turnos 
        WHERE numero_turno LIKE ?
        ORDER BY id DESC LIMIT 1
    """, (f"{prefijo}-%",))
    
    resultado = cursor.fetchone()
    
    if resultado:
        # Extraer el número del formato "XX-0001"
        ultimo_numero = int(resultado['numero_turno'].split('-')[1])
        nuevo_numero = ultimo_numero + 1
    else:
        nuevo_numero = 1
    
    numero_turno = f"{prefijo}-{nuevo_numero:04d}"
    
    # Verificar que no exista (doble verificación de unicidad)
    if verificar_unicidad:
        cursor.execute("""
            SELECT COUNT(*) as count FROM turnos 
            WHERE numero_turno = ?
        """, (numero_turno,))
        
        count = cursor.fetchone()['count']
        
        if count > 0:
            # Si ya existe, intentar recursivamente con el siguiente
            print(f"⚠️ Turno {numero_turno} ya existe, generando siguiente...")
            conn.close()
            # Buscar manualmente el siguiente disponible
            for i in range(nuevo_numero + 1, nuevo_numero + 100):
                test_turno = f"{prefijo}-{i:04d}"
                cursor = get_db_connection().cursor()
                cursor.execute("SELECT COUNT(*) as count FROM turnos WHERE numero_turno = ?", (test_turno,))
                if cursor.fetchone()['count'] == 0:
                    cursor.connection.close()
                    return test_turno
            raise Exception(f"No se pudo generar un número de turno único")
    
    conn.close()
    return numero_turno


def verificar_turno_existente(documento: str) -> dict:
    """Verifica si un paciente ya tiene un turno activo hoy"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        fecha_hoy = datetime.now().strftime("%Y-%m-%d")
        
        cursor.execute("""
            SELECT id, numero_turno, servicio, estado
            FROM turnos
            WHERE documento = ? 
            AND DATE(fecha_registro) = ?
            AND estado IN ('espera', 'llamado')
            ORDER BY fecha_registro DESC LIMIT 1
        """, (documento, fecha_hoy))
        
        turno = cursor.fetchone()
        
        if turno:
            return {
                "existe": True,
                "turno_id": turno['id'],
                "numero_turno": turno['numero_turno'],
                "servicio": turno['servicio'],
                "estado": turno['estado']
            }
        
        return {"existe": False}
    
    finally:
        conn.close()


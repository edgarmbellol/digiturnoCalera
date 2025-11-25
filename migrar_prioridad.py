"""Script para agregar campo de prioridad a turnos existentes"""
import sqlite3
import os

def migrar_base_datos():
    """Agrega el campo es_prioritario a la tabla turnos"""
    # Ruta de la base de datos SQLite
    db_path = os.path.join(os.path.dirname(__file__), 'digiturno.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar si la columna ya existe
        cursor.execute("PRAGMA table_info(turnos)")
        columnas = [col[1] for col in cursor.fetchall()]
        
        if 'es_prioritario' not in columnas:
            print("📊 Agregando columna 'es_prioritario' a la tabla turnos...")
            cursor.execute("""
                ALTER TABLE turnos 
                ADD COLUMN es_prioritario INTEGER DEFAULT 0
            """)
            conn.commit()
            print("✅ Columna agregada exitosamente")
        else:
            print("✓ La columna 'es_prioritario' ya existe")
        
        # Actualizar turnos existentes con discapacidad
        cursor.execute("""
            UPDATE turnos 
            SET es_prioritario = 1 
            WHERE condicion_especial = 'Discapacitado'
            AND es_prioritario = 0
        """)
        
        filas_actualizadas = cursor.rowcount
        if filas_actualizadas > 0:
            conn.commit()
            print(f"✅ {filas_actualizadas} turnos actualizados como prioritarios")
        
        print("✓ Migración completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    migrar_base_datos()


"""Script para verificar fechas en la base de datos"""
import sqlite3
from datetime import datetime

conn = sqlite3.connect('backend/digiturno.db')
cursor = conn.cursor()

print("=" * 60)
print("Verificando Fechas en Base de Datos")
print("=" * 60)
print()

cursor.execute("""
    SELECT numero_turno, fecha_registro, datetime('now') as ahora
    FROM turnos
    WHERE estado IN ('espera', 'llamado')
    ORDER BY fecha_registro DESC
    LIMIT 5
""")

turnos = cursor.fetchall()

print(f"Hora actual de SQLite: {cursor.execute('SELECT datetime(\"now\")').fetchone()[0]}")
print(f"Hora actual de Python:  {datetime.now()}")
print()

if turnos:
    print("Turnos activos:")
    print()
    for turno in turnos:
        numero, fecha_registro, ahora_sqlite = turno
        print(f"Turno: {numero}")
        print(f"  Fecha registro (SQLite): {fecha_registro}")
        print(f"  Ahora (SQLite):          {ahora_sqlite}")
        
        # Calcular diferencia
        try:
            if '.' in fecha_registro:
                fecha_obj = datetime.strptime(fecha_registro, '%Y-%m-%d %H:%M:%S.%f')
            else:
                fecha_obj = datetime.strptime(fecha_registro, '%Y-%m-%d %H:%M:%S')
            
            diferencia = (datetime.now() - fecha_obj).total_seconds() / 60
            print(f"  Diferencia (Python):     {diferencia:.1f} minutos")
        except Exception as e:
            print(f"  Error calculando: {e}")
        
        print()
else:
    print("No hay turnos activos")

conn.close()


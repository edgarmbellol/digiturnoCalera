"""
Script para limpiar turnos antiguos y verificar la base de datos
"""
import sqlite3

conn = sqlite3.connect('backend/digiturno.db')
cursor = conn.cursor()

print("=" * 60)
print("Verificando turnos en la base de datos")
print("=" * 60)
print()

# Ver todos los turnos activos
cursor.execute("""
    SELECT numero_turno, servicio, estado, nombre_paciente
    FROM turnos
    WHERE estado IN ('espera', 'llamado')
    ORDER BY servicio, estado
""")

turnos = cursor.fetchall()

if turnos:
    print(f"Se encontraron {len(turnos)} turnos activos:")
    print()
    
    servicios = {}
    for turno in turnos:
        numero, servicio, estado, nombre = turno
        if servicio not in servicios:
            servicios[servicio] = []
        servicios[servicio].append(f"  {numero} - {nombre} ({estado})")
    
    for servicio, lista in servicios.items():
        print(f"📋 {servicio}:")
        for item in lista:
            print(item)
        print()
else:
    print("✅ No hay turnos activos")

print("=" * 60)
print("¿Desea limpiar turnos antiguos? (s/n)")
respuesta = input("> ").strip().lower()

if respuesta == 's':
    # Limpiar todos los turnos antiguos
    cursor.execute("DELETE FROM turnos WHERE estado IN ('atendido', 'no_responde')")
    atendidos = cursor.rowcount
    
    cursor.execute("DELETE FROM llamados WHERE mostrado = 1")
    llamados = cursor.rowcount
    
    conn.commit()
    
    print()
    print(f"✅ Limpiados {atendidos} turnos atendidos/no_responde")
    print(f"✅ Limpiados {llamados} llamados mostrados")
    print()

print()
print("=" * 60)
print("Para reiniciar completamente la base de datos:")
print("1. Detener el sistema (stop.bat)")
print("2. Eliminar backend/digiturno.db")
print("3. Iniciar el sistema (start.bat)")
print("=" * 60)

conn.close()


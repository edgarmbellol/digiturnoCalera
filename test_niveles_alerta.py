"""
Script de prueba para verificar niveles de alerta
"""

def calcular_nivel(minutos):
    if minutos >= 60:
        return "critico"
    elif minutos >= 30:
        return "alto"
    elif minutos >= 15:
        return "medio"
    else:
        return "normal"

print("=" * 60)
print("Prueba de Niveles de Alerta")
print("=" * 60)
print()

# Casos de prueba
casos = [5, 10, 14, 15, 20, 28, 29, 30, 35, 45, 59, 60, 75, 90]

for minutos in casos:
    nivel = calcular_nivel(minutos)
    
    colores = {
        "normal": "🟢 VERDE",
        "medio": "🟡 AMARILLO",
        "alto": "🟠 NARANJA",
        "critico": "🔴 ROJO"
    }
    
    color = colores.get(nivel, "")
    print(f"{minutos:3d} min → {nivel:8s} → {color}")

print()
print("=" * 60)
print("Caso específico de tu paciente:")
print("=" * 60)
print()
print(f"28 minutos → {calcular_nivel(28)} → 🟡 AMARILLO (Medio)")
print(f"30 minutos → {calcular_nivel(30)} → 🟠 NARANJA (Alto)")
print()
print("Si ves VERDE (normal), hay un error en el código.")


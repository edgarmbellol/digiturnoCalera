# 🔍 Verificación de Servicios y Turnos Únicos

## 📋 Sistema de Servicios Implementado

### Servicios Separados

| Servicio | Prefijo | Generado Por | Se Ve En |
|----------|---------|--------------|----------|
| **Citas Médicas** | CM-XXXX | Kiosco | Panel Profesionales (Ventanilla 1-2) |
| **Consulta Médica** | MD-XXXX | Panel Médicos | Panel Médicos (Consultorio) |
| **Facturación** | FA-XXXX | Kiosco | Panel Profesionales (Ventanilla 1-3) |
| **Famisanar** | FS-XXXX | Kiosco | Panel Profesionales (Ventanilla 1) |
| **Nueva EPS** | NE-XXXX | Kiosco | Panel Profesionales (Ventanilla 1) |

## ✅ Sistema de Unicidad Implementado

### 1. **Verificación de Duplicados**
Cada turno pasa por 3 niveles de verificación:

```python
1. Verificar si el paciente ya tiene turno HOY
   └─ SI existe → Reutilizar ese turno
   └─ NO existe → Generar nuevo

2. Generar número basado en último del día
   └─ Buscar último MD-XXXX del día
   └─ Incrementar en 1

3. Verificar unicidad en base de datos
   └─ Consultar si existe ese número HOY
   └─ NO existe → Usar ese número ✅
   └─ SÍ existe → Generar siguiente número
```

### 2. **Prevención de Duplicados**

**Caso 1: Paciente se registra en kiosco**
```
Kiosco → CM-0001 (Citas Médicas)
```

**Caso 2: Médico llama al mismo paciente**
```
Médico busca → ¿Tiene turno activo?
           → SÍ: CM-0001 → Reutiliza ese turno ✅
           → NO: Genera MD-0001 (nuevo único)
```

**Caso 3: Dos médicos llaman a diferentes pacientes simultáneamente**
```
Médico 1 → MD-0001 (único)
Médico 2 → MD-0002 (único, no se repite)
```

## 🧪 Cómo Verificar que Funciona Correctamente

### Prueba 1: Turnos del Kiosco NO aparecen en Panel Médicos
1. Registrar turno en kiosco para "Citas Médicas"
2. Abrir panel de médicos
3. ✅ NO debe aparecer ese paciente en la lista

### Prueba 2: Turnos de Médicos NO aparecen en Panel Profesionales
1. Médico llama a un paciente de su agenda
2. Abrir panel de profesionales "Citas Médicas"
3. ✅ NO debe aparecer ese paciente en la lista

### Prueba 3: Números Únicos
1. Registrar turno en kiosco → CM-0001
2. Médico llama paciente → MD-0001
3. Registrar otro en kiosco → CM-0002
4. Médico llama otro → MD-0002
5. ✅ Todos los números son diferentes y únicos

### Prueba 4: Reutilización de Turnos
1. Paciente se registra en kiosco → CM-0001
2. Médico llama al mismo paciente
3. ✅ Debe reutilizar CM-0001 (no crear MD-0001)
4. Aparece en pantalla con número CM-0001

## 🛠️ Herramientas de Verificación

### Script 1: Ver Turnos Activos
```bash
python limpiar_turnos_antiguos.py
```

Muestra:
```
📋 Consulta Médica:
  MD-0001 - Juan Pérez (llamado)
  MD-0002 - María López (espera)

📋 Citas Médicas:
  CM-0001 - Carlos García (espera)
  CM-0002 - Ana Torres (llamado)
```

### Script 2: Reiniciar Base de Datos Limpia
```bash
reiniciar_base_datos.bat
```

Elimina toda la base de datos y empieza de cero.

## 🔒 Garantías de Unicidad

✅ **Verificación por documento**: Si el paciente ya tiene turno HOY, se reutiliza  
✅ **Verificación por número**: Antes de asignar, verifica que no exista  
✅ **Prefijos separados**: CM vs MD nunca se mezclan  
✅ **Reintentos automáticos**: Si hay conflicto, genera el siguiente número  
✅ **Límite de 100 intentos**: Protección contra bucles infinitos  

## 📊 Logs del Sistema

Al llamar un paciente, verás en consola del backend:

**Caso 1: Paciente sin turno**
```
✅ Generando turno único: MD-0001 para paciente 123456789
INFO: Paciente llamado exitosamente (turno nuevo único)
```

**Caso 2: Paciente con turno existente**
```
ℹ️ Paciente 123456789 ya tiene turno activo: CM-0001
INFO: Paciente llamado (turno existente reutilizado)
```

**Caso 3: Número duplicado (muy raro)**
```
⚠️ Turno MD-0005 ya existe, generando siguiente...
✅ Generando turno único: MD-0006 para paciente 987654321
```

## 🚨 Si Ves Turnos Incorrectos

### Problema: Pacientes de médicos en panel de "Citas Médicas"

**Causa**: Turnos antiguos creados antes de la separación de servicios.

**Solución**:
```bash
# Opción 1: Limpiar turnos antiguos
python limpiar_turnos_antiguos.py
# Seleccionar "s" para limpiar

# Opción 2: Reiniciar base de datos completa
reiniciar_base_datos.bat
restart.bat
```

### Verificación Manual en Base de Datos

```bash
cd backend
sqlite3 digiturno.db
```

```sql
-- Ver turnos por servicio
SELECT servicio, COUNT(*) as total
FROM turnos
WHERE estado IN ('espera', 'llamado')
GROUP BY servicio;

-- Debe mostrar:
-- Consulta Médica | X
-- Citas Médicas   | Y
-- (NO deben mezclarse)

-- Ver si hay duplicados
SELECT numero_turno, COUNT(*) as duplicados
FROM turnos
WHERE DATE(fecha_registro) = DATE('now')
GROUP BY numero_turno
HAVING COUNT(*) > 1;

-- Debe estar vacío (sin duplicados)
```

## 🎯 Resumen

Con el nuevo sistema:
1. ✅ **Prefijos únicos** por servicio (CM, MD, FA, FS, NE)
2. ✅ **Verificación de existencia** antes de crear
3. ✅ **Reutilización inteligente** si el paciente ya tiene turno
4. ✅ **No hay colisiones** entre servicios
5. ✅ **Números siempre únicos** dentro del mismo día

---

**Ejecuta `restart.bat` y verifica que ahora funcione correctamente.**


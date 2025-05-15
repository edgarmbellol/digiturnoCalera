from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_socketio import SocketIO, emit
from config.config import SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD
from database.db import verificar_paciente, validar_usuario
from database.database_app import generar_turno, obtener_turnos_espera, llamar_turno
from functools import wraps
from datetime import datetime
import threading
import time

app = Flask(__name__)
app.config['ENV'] = 'development'  # Cambiar según el entorno
app.secret_key = 'tu_clave_secreta_aqui'  # Necesario para usar session
socketio = SocketIO(app, cors_allowed_origins="*")

# Caché para los turnos
turnos_cache = {
    'citas': {'turnos': [], 'ultima_actualizacion': None},
    'facturacion': {'turnos': [], 'ultima_actualizacion': None},
    'famisanar': {'turnos': [], 'ultima_actualizacion': None},
    'sanitas': {'turnos': [], 'ultima_actualizacion': None}
}

# Lock para proteger el acceso a la caché
cache_lock = threading.Lock()

def actualizar_turnos_servicio(servicio):
    """
    Actualiza los turnos de un servicio específico y emite los cambios
    """
    try:
        turnos = obtener_turnos_espera(servicio)
        with cache_lock:
            turnos_cache[servicio]['turnos'] = turnos
            turnos_cache[servicio]['ultima_actualizacion'] = datetime.now()
        
        # Emitir los nuevos turnos a todos los clientes conectados
        socketio.emit(f'turnos_actualizados_{servicio}', {
            'turnos': [{
                'numero_turno': t['numero_turno'],
                'documento': t['documento'],
                'nombre': t['nombre'],
                'hora': t['fecha_creacion'].strftime('%H:%M'),
                'condicion_especial': t['condicion_especial']
            } for t in turnos],
            'ultima_actualizacion': datetime.now().strftime('%H:%M:%S')
        })
        return True
    except Exception as e:
        print(f"Error actualizando turnos de {servicio}: {e}")
        return False

@socketio.on('connect')
def handle_connect():
    """
    Maneja la conexión de un nuevo cliente
    """
    print('Cliente conectado')

@socketio.on('disconnect')
def handle_disconnect():
    """
    Maneja la desconexión de un cliente
    """
    print('Cliente desconectado')

@socketio.on('solicitar_turnos')
def handle_solicitar_turnos(data):
    """
    Maneja la solicitud de turnos de un servicio específico
    """
    servicio = data.get('servicio', 'citas')
    with cache_lock:
        turnos = turnos_cache[servicio]['turnos']
        ultima_actualizacion = turnos_cache[servicio]['ultima_actualizacion']
    
    emit('turnos_actualizados', {
        'turnos': [{
            'numero_turno': t['numero_turno'],
            'documento': t['documento'],
            'nombre': t['nombre'],
            'hora': t['fecha_creacion'].strftime('%H:%M'),
            'condicion_especial': t['condicion_especial']
        } for t in turnos],
        'ultima_actualizacion': ultima_actualizacion.strftime('%H:%M:%S') if ultima_actualizacion else None
    })

# Decorador para proteger rutas que requieren login
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        clave = request.form.get('clave')
        ventanilla = request.form.get('ventanilla')
        tipo_servicio = request.form.get('tipo_servicio')
        
        if not usuario or not clave or not ventanilla or not tipo_servicio:
            return render_template('login.html', error='Por favor complete todos los campos')
        
        resultado = validar_usuario(usuario, clave)
        
        if resultado == "Error":
            return render_template('login.html', error='Usuario o contraseña incorrectos')
        
        # Guardar información del usuario en la sesión
        session['usuario_id'] = usuario
        session['usuario_nombre'] = resultado
        session['ventanilla'] = ventanilla
        session['tipo_servicio'] = tipo_servicio
        
        return redirect(url_for('panel_profesional'))
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/panel')
@login_required
def panel_profesional():
    turnos_espera = obtener_turnos_espera(session.get('tipo_servicio'))
    turno_actual = session.get('turno_actual')
    return render_template('profesional.html', 
                         turnos_espera=turnos_espera,
                         turno_actual=turno_actual)

@app.route('/obtener_turnos')
@login_required
def obtener_turnos():
    servicio = request.args.get('servicio', 'citas')
    
    with cache_lock:
        turnos = turnos_cache[servicio]['turnos']
        ultima_actualizacion = turnos_cache[servicio]['ultima_actualizacion']
    
    return jsonify({
        'turnos': [{
            'numero_turno': t['numero_turno'],
            'documento': t['documento'],
            'nombre': t['nombre'],
            'hora': t['fecha_creacion'].strftime('%H:%M')
        } for t in turnos],
        'ultima_actualizacion': ultima_actualizacion.strftime('%H:%M:%S') if ultima_actualizacion else None
    })

@app.route('/llamar_turno', methods=['POST'])
@login_required
def llamar_turno_route():
    data = request.json
    resultado = llamar_turno(
        numero_turno=data['numero_turno'],
        documento=data['documento'],
        nombre=data['nombre']
    )
    
    if resultado:
        # Actualizar la caché y emitir los cambios
        servicio = data['tipo_servicio']
        if actualizar_turnos_servicio(servicio):
            return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Error al llamar el turno'})

@app.route('/verificar_paciente', methods=['POST'])
def verificar_paciente_route():
    documento = request.json.get('documento')
    tipo_servicio = request.json.get('tipo_servicio')
    
    if not documento:
        return jsonify({'error': 'Documento no proporcionado'}), 400
    
    resultado = verificar_paciente(documento)
    
    # Si es facturación, solo necesitamos verificar que existe
    if tipo_servicio == 'facturacion':
        return jsonify({'existe': resultado['existe']})
    
    # Para otros servicios, retornamos también el nombre si existe
    return jsonify(resultado)

@app.route('/ingreso', methods=['GET', 'POST'])
def ingreso():
    tipo_servicio = request.args.get('tipo', 'citas')  # Obtener el tipo de servicio de los parámetros de URL
    
    if request.method == 'POST':
        tipo_servicio = request.form.get('tipo_servicio')
        cedula = request.form.get('cedula')
        nombre = request.form.get('nombre')
        condicion_especial = request.form.get('condicion_especial', 'ninguna')
        
        # Verificar si el paciente existe en CITISALUD
        resultado = verificar_paciente(cedula)
        
        if not resultado['existe'] and tipo_servicio != 'facturacion':
            # Si no existe y no es facturación, necesitamos el nombre
            if not nombre:
                return render_template('ingreso.html', 
                                    error="Por favor ingrese el nombre del paciente",
                                    tipo_servicio=tipo_servicio,
                                    cedula=cedula)
        
        # Generar el turno en APLICACION
        turno = generar_turno(
            tipo_servicio=tipo_servicio,
            documento=cedula,
            nombre=nombre if not resultado['existe'] else resultado['nombre_completo'],
            condicion_especial=condicion_especial
        )
        
        if 'error' in turno:
            return render_template('ingreso.html',
                                error="Error al generar el turno. Por favor intente nuevamente.",
                                tipo_servicio=tipo_servicio,
                                cedula=cedula)
        
        # Guardar el turno en la sesión
        session['turno_actual'] = turno
        
        # Actualizar inmediatamente los turnos en el panel profesional
        actualizar_turnos_servicio(tipo_servicio)
        
        return redirect(url_for('espera', tipo_servicio=tipo_servicio))
    
    return render_template('ingreso.html', tipo_servicio=tipo_servicio)

@app.route('/espera/<tipo_servicio>')
def espera(tipo_servicio):
    turno = session.get('turno_actual')
    if not turno:
        return redirect(url_for('index'))
    return render_template('espera.html', 
                         tipo_servicio=tipo_servicio,
                         turno=turno)

# Iniciar la actualización periódica de turnos
def iniciar_actualizacion_periodica():
    while True:
        try:
            for servicio in turnos_cache.keys():
                actualizar_turnos_servicio(servicio)
            time.sleep(30)  # Actualizar cada 30 segundos
        except Exception as e:
            print(f"Error en actualización periódica: {e}")
            time.sleep(5)

# Iniciar el hilo de actualización en segundo plano
threading.Thread(target=iniciar_actualizacion_periodica, daemon=True).start()

if __name__ == '__main__':
    socketio.run(app, debug=True) 
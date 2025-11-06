import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LogOut, Settings, BarChart3, Users, Save, Plus, Minus, Shield, 
  Edit2, Trash2, PlusCircle, Sparkles, RefreshCw, Clock 
} from 'lucide-react'
import { adminAPI, aiAPI } from '../services/api'

interface ConfiguracionServicio {
  id: number
  servicio: string
  num_ventanillas: number
  activo: boolean
}

interface Estadisticas {
  fecha: string
  total_turnos: number
  por_estado: Record<string, number>
  por_servicio: Record<string, number>
  promedio_espera_minutos: number
  atendidos: number
  no_responde: number
}

interface SesionActiva {
  codigo_usuario: string
  nombre_usuario: string
  servicio: string
  ventanilla: number
  fecha_login: string
}

interface PacienteEnEspera {
  id: number
  numero_turno: string
  documento: string
  nombre_paciente: string
  servicio: string
  condicion_especial: string | null
  ventanilla: number | null
  estado: string
  profesional_codigo: string | null
  fecha_registro: string
  fecha_llamado: string | null
  tiempo_espera_minutos: number
  tiempo_espera_formato: string
  nivel_alerta: string
}

interface Observacion {
  id: number
  numero_turno: string
  documento: string
  nombre_paciente: string
  servicio: string
  ventanilla: number | null
  estado: string
  profesional_codigo: string | null
  observacion: string
  fecha_registro: string
  fecha_atencion: string | null
}

const AdminPanel = () => {
  const navigate = useNavigate()
  const [sesion, setSesion] = useState<any>(null)
  const [configuracion, setConfiguracion] = useState<ConfiguracionServicio[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [sesionesActivas, setSesionesActivas] = useState<SesionActiva[]>([])
  const [pacientesEspera, setPacientesEspera] = useState<PacienteEnEspera[]>([])
  const [pacientesFiltrados, setPacientesFiltrados] = useState<PacienteEnEspera[]>([])
  const [observaciones, setObservaciones] = useState<Observacion[]>([])
  const [observacionesFiltradas, setObservacionesFiltradas] = useState<Observacion[]>([])
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [busquedaObservacion, setBusquedaObservacion] = useState('')
  const [analisisIA, setAnalisisIA] = useState<string | null>(null)
  const [cargandoIA, setCargandoIA] = useState(false)
  const [ultimoAnalisis, setUltimoAnalisis] = useState<Date | null>(null)
  const [tiempoEspera, setTiempoEspera] = useState(0)
  const [vistaActual, setVistaActual] = useState<'config' | 'stats' | 'sesiones' | 'monitoreo' | 'observaciones' | 'ia'>('config')
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState<number | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [mostrarAgregarServicio, setMostrarAgregarServicio] = useState(false)
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', ventanillas: 1 })

  useEffect(() => {
    // Verificar sesión
    const sesionGuardada = localStorage.getItem('admin_session')
    if (!sesionGuardada) {
      navigate('/admin/login')
      return
    }

    const sesionData = JSON.parse(sesionGuardada)
    setSesion(sesionData)

    // Cargar datos
    cargarConfiguracion()
    cargarEstadisticas()
    cargarSesionesActivas()
    cargarPacientesEspera()
    cargarObservaciones()

    // Actualizar cada 5 segundos (más frecuente para monitoreo)
    const intervalo = setInterval(() => {
      cargarEstadisticas()
      cargarSesionesActivas()
      cargarPacientesEspera()
      cargarObservaciones()
    }, 5000)

    // Temporizador para el tiempo de espera entre análisis
    const temporizador = setInterval(() => {
      if (ultimoAnalisis) {
        const ahora = new Date()
        const tiempoTranscurrido = Math.floor((ahora.getTime() - ultimoAnalisis.getTime()) / 1000)
        const tiempoRestante = Math.max(0, 60 - tiempoTranscurrido)
        setTiempoEspera(tiempoRestante)
      } else {
        setTiempoEspera(0)
      }
    }, 1000)

    return () => {
      clearInterval(intervalo)
      clearInterval(temporizador)
    }
  }, [navigate, ultimoAnalisis])

  const cargarConfiguracion = async () => {
    try {
      const data = await adminAPI.obtenerConfiguracion()
      setConfiguracion(data)
    } catch (error) {
      console.error('Error cargando configuración:', error)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const data = await adminAPI.obtenerEstadisticas()
      setEstadisticas(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const cargarSesionesActivas = async () => {
    try {
      const data = await adminAPI.obtenerSesionesActivas()
      setSesionesActivas(data)
    } catch (error) {
      console.error('Error cargando sesiones:', error)
    }
  }

  const cargarPacientesEspera = async () => {
    try {
      const data = await adminAPI.obtenerPacientesEnEspera()
      console.log('📊 Pacientes en espera recibidos:', data)
      setPacientesEspera(data)
      setPacientesFiltrados(data)
      
      // Debug: Mostrar niveles de alerta
      data.forEach((p: PacienteEnEspera) => {
        console.log(`${p.numero_turno}: ${p.tiempo_espera_minutos}min → Nivel: ${p.nivel_alerta}`)
      })
    } catch (error) {
      console.error('Error cargando pacientes en espera:', error)
    }
  }

  const cargarObservaciones = async () => {
    try {
      const data = await adminAPI.obtenerObservaciones()
      setObservaciones(data)
      setObservacionesFiltradas(data)
    } catch (error) {
      console.error('Error cargando observaciones:', error)
    }
  }

  const generarAnalisisIA = async (numTurnos: number = 100) => {
    // Verificar si hay que esperar
    if (ultimoAnalisis) {
      const ahora = new Date()
      const tiempoTranscurrido = (ahora.getTime() - ultimoAnalisis.getTime()) / 1000 // en segundos
      const tiempoMinimo = 60 // 60 segundos entre análisis
      
      if (tiempoTranscurrido < tiempoMinimo) {
        const segundosFaltantes = Math.ceil(tiempoMinimo - tiempoTranscurrido)
        alert(`⏱️ Espera ${segundosFaltantes} segundos antes del siguiente análisis\n\nEsto previene el error 429 (límite de solicitudes)`)
        return
      }
    }
    
    setCargandoIA(true)
    setAnalisisIA(null)
    
    try {
      const resultado = await aiAPI.analizarTurnos(numTurnos)
      
      if (resultado.success) {
        setAnalisisIA(resultado.analisis)
        setUltimoAnalisis(new Date())
        
        // Mostrar si vino del caché
        if (resultado.desde_cache) {
          console.log(`📦 Análisis obtenido del caché (${resultado.cache_edad_segundos}s de antigüedad)`)
        }
      } else {
        // Mostrar error específico
        let mensajeError = 'Error al generar análisis con IA'
        
        if (resultado.error === 'quota_exceeded') {
          mensajeError = `⏱️ ${resultado.mensaje}\n\n${resultado.detalle}\n\nPuedes:\n• Esperar 1-2 minutos e intentar de nuevo\n• Analizar menos turnos (50 en lugar de 100)`
        } else if (resultado.error === 'api_key_invalid') {
          mensajeError = `🔑 ${resultado.mensaje}\n\nVerifica la API key en backend/config.py`
        } else {
          mensajeError = `❌ ${resultado.mensaje}\n\nDetalle: ${resultado.detalle}`
        }
        
        alert(mensajeError)
      }
    } catch (error: any) {
      console.error('Error generando análisis:', error)
      const errorMsg = error.response?.data?.detail || error.message
      alert(`❌ Error al conectar con el servicio de IA:\n\n${errorMsg}\n\nVerifica:\n• Conexión a internet\n• API key de Gemini válida`)
    } finally {
      setCargandoIA(false)
    }
  }

  // Filtrar pacientes por búsqueda
  useEffect(() => {
    if (!busquedaPaciente) {
      setPacientesFiltrados(pacientesEspera)
      return
    }

    const busquedaLower = busquedaPaciente.toLowerCase()
    const filtrados = pacientesEspera.filter(p =>
      p.nombre_paciente.toLowerCase().includes(busquedaLower) ||
      p.documento.includes(busquedaPaciente) ||
      p.numero_turno.toLowerCase().includes(busquedaLower)
    )
    setPacientesFiltrados(filtrados)
  }, [busquedaPaciente, pacientesEspera])

  // Filtrar observaciones por búsqueda
  useEffect(() => {
    if (!busquedaObservacion) {
      setObservacionesFiltradas(observaciones)
      return
    }

    const busquedaLower = busquedaObservacion.toLowerCase()
    const filtradas = observaciones.filter(obs =>
      obs.nombre_paciente.toLowerCase().includes(busquedaLower) ||
      obs.documento.includes(busquedaObservacion) ||
      obs.numero_turno.toLowerCase().includes(busquedaLower) ||
      obs.observacion.toLowerCase().includes(busquedaLower) ||
      obs.servicio.toLowerCase().includes(busquedaLower)
    )
    setObservacionesFiltradas(filtradas)
  }, [busquedaObservacion, observaciones])

  const handleCambiarVentanillas = (servicio: string, incremento: number) => {
    setConfiguracion(prev => 
      prev.map(config => {
        if (config.servicio === servicio) {
          const nuevo = Math.max(1, Math.min(20, config.num_ventanillas + incremento))
          return { ...config, num_ventanillas: nuevo }
        }
        return config
      })
    )
  }

  const handleGuardarConfiguracion = async () => {
    setGuardando(true)
    
    try {
      for (const config of configuracion) {
        await adminAPI.actualizarVentanillas({
          servicio: config.servicio,
          num_ventanillas: config.num_ventanillas
        })
      }
      
      alert('✅ Configuración guardada exitosamente')
      await cargarConfiguracion()
    } catch (error) {
      console.error('Error guardando configuración:', error)
      alert('❌ Error al guardar la configuración')
    } finally {
      setGuardando(false)
    }
  }

  const handleEditarNombre = (id: number, nombreActual: string) => {
    setEditando(id)
    setNuevoNombre(nombreActual)
  }

  const handleGuardarNombre = async (servicioActual: string) => {
    if (!nuevoNombre || nuevoNombre.trim().length < 3) {
      alert('El nombre debe tener al menos 3 caracteres')
      return
    }

    try {
      await adminAPI.renombrarServicio({
        servicio_actual: servicioActual,
        servicio_nuevo: nuevoNombre.trim()
      })
      
      alert('✅ Servicio renombrado exitosamente')
      setEditando(null)
      setNuevoNombre('')
      await cargarConfiguracion()
    } catch (error: any) {
      alert(error.response?.data?.detail || '❌ Error al renombrar servicio')
    }
  }

  const handleAgregarServicio = async () => {
    if (!nuevoServicio.nombre || nuevoServicio.nombre.trim().length < 3) {
      alert('El nombre debe tener al menos 3 caracteres')
      return
    }

    try {
      await adminAPI.agregarServicio({
        nombre: nuevoServicio.nombre.trim(),
        num_ventanillas: nuevoServicio.ventanillas
      })
      
      alert('✅ Servicio agregado exitosamente')
      setMostrarAgregarServicio(false)
      setNuevoServicio({ nombre: '', ventanillas: 1 })
      await cargarConfiguracion()
    } catch (error: any) {
      alert(error.response?.data?.detail || '❌ Error al agregar servicio')
    }
  }

  const handleEliminarServicio = async (servicio: string) => {
    if (!confirm(`¿Está seguro de desactivar el servicio "${servicio}"?`)) {
      return
    }

    try {
      await adminAPI.eliminarServicio(servicio)
      alert('✅ Servicio desactivado')
      await cargarConfiguracion()
    } catch (error: any) {
      alert(error.response?.data?.detail || '❌ Error al eliminar servicio')
    }
  }

  const handleLogout = async () => {
    if (sesion) {
      try {
        await adminAPI.logout(sesion.sesion_id)
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      }
    }
    localStorage.removeItem('admin_session')
    navigate('/admin/login')
  }

  if (!sesion) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Shield className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold">Panel de Administración</h1>
                <p className="text-sm opacity-90">Hospital Divino Salvador de Sopó</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-75">Administrador</p>
                <p className="font-semibold">{sesion.codigo_usuario}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setVistaActual('config')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all flex items-center space-x-2 ${
                vistaActual === 'config'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Configuración</span>
            </button>
            <button
              onClick={() => setVistaActual('stats')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all flex items-center space-x-2 ${
                vistaActual === 'stats'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Estadísticas</span>
            </button>
            <button
              onClick={() => setVistaActual('monitoreo')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all flex items-center space-x-2 ${
                vistaActual === 'monitoreo'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Monitoreo ({pacientesEspera.length})</span>
            </button>
            <button
              onClick={() => setVistaActual('observaciones')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all flex items-center space-x-2 ${
                vistaActual === 'observaciones'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Observaciones ({observaciones.length})</span>
            </button>
            <button
              onClick={() => setVistaActual('ia')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all flex items-center space-x-2 ${
                vistaActual === 'ia'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>Análisis con IA</span>
            </button>
            <button
              onClick={() => setVistaActual('sesiones')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all flex items-center space-x-2 ${
                vistaActual === 'sesiones'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Sesiones ({sesionesActivas.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-8">
        {/* Vista de Configuración */}
        {vistaActual === 'config' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-hospital-dark">
                Configuración de Ventanillas y Consultorios
              </h2>
              <button
                onClick={handleGuardarConfiguracion}
                disabled={guardando}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

            <div className="grid gap-6">
              {configuracion.map((config) => {
                const esConsultorio = config.servicio === 'Consulta Médica'
                const tipo = esConsultorio ? 'Consultorios' : 'Ventanillas'
                const esProtegido = ['Citas Médicas', 'Consulta Médica'].includes(config.servicio)
                const estaEditando = editando === config.id
                
                return (
                  <div key={config.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {estaEditando ? (
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={nuevoNombre}
                              onChange={(e) => setNuevoNombre(e.target.value)}
                              className="input-field text-lg font-bold"
                              placeholder="Nombre del servicio"
                              autoFocus
                            />
                            <button
                              onClick={() => handleGuardarNombre(config.servicio)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditando(null)
                                setNuevoNombre('')
                              }}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-hospital-dark">
                                {config.servicio}
                              </h3>
                              {!esProtegido && (
                                <button
                                  onClick={() => handleEditarNombre(config.id, config.servicio)}
                                  className="text-blue-600 hover:text-blue-800 transition-all"
                                  title="Editar nombre"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                              )}
                              {esProtegido && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  Protegido
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600">
                              {tipo} disponibles para este servicio
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Número de {tipo}</p>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleCambiarVentanillas(config.servicio, -1)}
                              disabled={config.num_ventanillas <= 1}
                              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white w-12 h-12 rounded-lg transition-all flex items-center justify-center"
                            >
                              <Minus className="w-6 h-6" />
                            </button>
                            
                            <div className="bg-purple-100 px-8 py-4 rounded-lg min-w-[80px]">
                              <p className="text-4xl font-bold text-purple-600">
                                {config.num_ventanillas}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleCambiarVentanillas(config.servicio, 1)}
                              disabled={config.num_ventanillas >= 20}
                              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white w-12 h-12 rounded-lg transition-all flex items-center justify-center"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          </div>
                        </div>

                        {!esProtegido && (
                          <button
                            onClick={() => handleEliminarServicio(config.servicio)}
                            className="text-red-600 hover:text-red-800 transition-all p-2"
                            title="Eliminar servicio"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Botón para agregar nuevo servicio */}
              <button
                onClick={() => setMostrarAgregarServicio(true)}
                className="card border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all p-8 text-center"
              >
                <PlusCircle className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-purple-600">
                  Agregar Nuevo Servicio
                </p>
              </button>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
              <ul className="text-blue-800 space-y-2 text-sm">
                <li>• Los cambios se aplicarán inmediatamente después de guardar</li>
                <li>• Puedes editar los nombres de "Famisanar" y "Nueva EPS" para adaptarlos a otros convenios</li>
                <li>• Los servicios "Citas Médicas" y "Consulta Médica" están protegidos</li>
                <li>• Los profesionales verán los nombres actualizados en el login</li>
                <li>• Mínimo: 1 ventanilla/consultorio | Máximo: 20</li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal Agregar Servicio */}
        {mostrarAgregarServicio && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-hospital-dark mb-6">
                Agregar Nuevo Servicio
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Servicio
                  </label>
                  <input
                    type="text"
                    value={nuevoServicio.nombre}
                    onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
                    className="input-field"
                    placeholder="Ej: Sanitas, Compensar, etc."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Ventanillas
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setNuevoServicio({ 
                        ...nuevoServicio, 
                        ventanillas: Math.max(1, nuevoServicio.ventanillas - 1) 
                      })}
                      className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-lg"
                    >
                      <Minus className="w-5 h-5 mx-auto" />
                    </button>
                    
                    <div className="bg-purple-100 px-6 py-3 rounded-lg flex-1 text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {nuevoServicio.ventanillas}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setNuevoServicio({ 
                        ...nuevoServicio, 
                        ventanillas: Math.min(20, nuevoServicio.ventanillas + 1) 
                      })}
                      className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-lg"
                    >
                      <Plus className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setMostrarAgregarServicio(false)
                    setNuevoServicio({ nombre: '', ventanillas: 1 })
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarServicio}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Estadísticas */}
        {vistaActual === 'stats' && estadisticas && (
          <div>
            <h2 className="text-2xl font-bold text-hospital-dark mb-6">
              Estadísticas del Día - {estadisticas.fecha}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <p className="text-sm opacity-90 mb-2">Total de Turnos</p>
                <p className="text-5xl font-bold">{estadisticas.total_turnos}</p>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <p className="text-sm opacity-90 mb-2">Atendidos</p>
                <p className="text-5xl font-bold">{estadisticas.atendidos}</p>
              </div>

              <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
                <p className="text-sm opacity-90 mb-2">No Respondieron</p>
                <p className="text-5xl font-bold">{estadisticas.no_responde}</p>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <p className="text-sm opacity-90 mb-2">Tiempo Promedio</p>
                <p className="text-4xl font-bold">{estadisticas.promedio_espera_minutos} min</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-bold text-hospital-dark mb-4">
                  Turnos por Estado
                </h3>
                <div className="space-y-3">
                  {Object.entries(estadisticas.por_estado).map(([estado, cantidad]) => (
                    <div key={estado} className="flex justify-between items-center">
                      <span className="font-semibold capitalize">{estado}</span>
                      <span className="bg-gray-200 px-4 py-2 rounded-lg font-bold">
                        {cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl font-bold text-hospital-dark mb-4">
                  Turnos por Servicio
                </h3>
                <div className="space-y-3">
                  {Object.entries(estadisticas.por_servicio).map(([servicio, cantidad]) => (
                    <div key={servicio} className="flex justify-between items-center">
                      <span className="font-semibold">{servicio}</span>
                      <span className="bg-gray-200 px-4 py-2 rounded-lg font-bold">
                        {cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Monitoreo en Tiempo Real */}
        {vistaActual === 'monitoreo' && (
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-hospital-dark">
                  Monitoreo de Pacientes en Tiempo Real
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="font-semibold">Total en espera:</span>{' '}
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">
                      {pacientesEspera.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de búsqueda */}
              <div className="card">
                <div className="relative">
                  <input
                    type="text"
                    value={busquedaPaciente}
                    onChange={(e) => setBusquedaPaciente(e.target.value)}
                    placeholder="🔍 Buscar por nombre, documento o número de turno..."
                    className="input-field text-lg pr-12"
                  />
                  {busquedaPaciente && (
                    <button
                      onClick={() => setBusquedaPaciente('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {busquedaPaciente && (
                  <p className="text-sm text-gray-600 mt-2">
                    Mostrando {pacientesFiltrados.length} de {pacientesEspera.length} pacientes
                  </p>
                )}
              </div>
            </div>

            {/* Leyenda de colores */}
            <div className="bg-white rounded-lg p-4 mb-6 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Normal (&lt;15 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Medio (15-30 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Alto (30-60 min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded animate-pulse"></div>
                <span>Crítico (&gt;60 min)</span>
              </div>
            </div>

            {pacientesFiltrados.length === 0 ? (
              <div className="card text-center py-20">
                <p className="text-2xl text-gray-400">
                  {busquedaPaciente ? 'No se encontraron pacientes' : 'No hay pacientes en espera'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pacientesFiltrados.map((paciente) => {
                  // Asegurar que los colores correspondan al nivel de alerta
                  let colorBorde = 'border-green-500 bg-green-50'
                  let colorBadge = 'bg-green-500 text-white'
                  
                  if (paciente.nivel_alerta === 'critico') {
                    colorBorde = 'border-red-500 bg-red-50'
                    colorBadge = 'bg-red-500 text-white animate-pulse'
                  } else if (paciente.nivel_alerta === 'alto') {
                    colorBorde = 'border-orange-500 bg-orange-50'
                    colorBadge = 'bg-orange-500 text-white'
                  } else if (paciente.nivel_alerta === 'medio') {
                    colorBorde = 'border-yellow-500 bg-yellow-50'
                    colorBadge = 'bg-yellow-500 text-white'
                  }
                  
                  console.log(`Paciente ${paciente.numero_turno}: ${paciente.tiempo_espera_minutos}min → Nivel: ${paciente.nivel_alerta} → Color: ${colorBadge}`)

                  return (
                    <div
                      key={paciente.id}
                      className={`card border-4 ${colorBorde} transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="bg-hospital-blue text-white rounded-lg p-4 min-w-[120px] text-center">
                            <p className="text-sm opacity-75">Turno</p>
                            <p className="text-2xl font-bold">{paciente.numero_turno}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <p className="text-2xl font-bold text-hospital-dark">
                                {paciente.nombre_paciente}
                              </p>
                              {paciente.estado === 'llamado' && (
                                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                  LLAMADO
                                </span>
                              )}
                              {paciente.condicion_especial && paciente.condicion_especial !== 'Ninguna' && (
                                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  {paciente.condicion_especial}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Doc: {paciente.documento}</span>
                              <span className="font-semibold">{paciente.servicio}</span>
                              {paciente.ventanilla && (
                                <span>
                                  {paciente.servicio === 'Consulta Médica' ? 'Consultorio' : 'Ventanilla'}: {paciente.ventanilla}
                                </span>
                              )}
                              {paciente.profesional_codigo && (
                                <span className="text-blue-600">
                                  Profesional: {paciente.profesional_codigo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`${colorBadge} px-6 py-3 rounded-lg mb-2`}>
                            <p className="text-sm opacity-90">Tiempo de Espera</p>
                            <p className="text-3xl font-bold">{paciente.tiempo_espera_formato}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Desde: {new Date(paciente.fecha_registro).toLocaleTimeString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Resumen por servicio y nivel de alerta */}
            {pacientesEspera.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-hospital-dark mb-4">Resumen por Servicio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(
                    pacientesEspera.reduce((acc, p) => {
                      acc[p.servicio] = (acc[p.servicio] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([servicio, cantidad]) => (
                    <div key={servicio} className="card bg-purple-50">
                      <p className="text-sm text-gray-600">En espera en</p>
                      <p className="text-lg font-bold text-hospital-dark">{servicio}</p>
                      <p className="text-3xl font-bold text-purple-600">{cantidad}</p>
                    </div>
                  ))}
                </div>

                {/* Alertas por nivel */}
                <h3 className="text-xl font-bold text-hospital-dark mb-4 mt-6">Alertas por Tiempo de Espera</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { nivel: 'critico', label: 'Críticos (>60min)', color: 'bg-red-500', icon: '🚨' },
                    { nivel: 'alto', label: 'Altos (30-60min)', color: 'bg-orange-500', icon: '⚠️' },
                    { nivel: 'medio', label: 'Medios (15-30min)', color: 'bg-yellow-500', icon: '⏰' },
                    { nivel: 'normal', label: 'Normales (<15min)', color: 'bg-green-500', icon: '✅' }
                  ].map((item) => {
                    const count = pacientesEspera.filter(p => p.nivel_alerta === item.nivel).length

                    return (
                      <div 
                        key={item.nivel} 
                        className={`${item.color} text-white rounded-xl shadow-xl p-6 transition-all hover:shadow-2xl`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-4xl">{item.icon}</span>
                          <span className="text-6xl font-bold">{count}</span>
                        </div>
                        <p className="text-base font-semibold">{item.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista de Observaciones */}
        {vistaActual === 'observaciones' && (
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-hospital-dark">
                  Registro de Observaciones
                </h2>
                <div className="text-sm">
                  <span className="font-semibold">Total registradas:</span>{' '}
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">
                    {observaciones.length}
                  </span>
                </div>
              </div>

              {/* Barra de búsqueda */}
              <div className="card">
                <div className="relative">
                  <input
                    type="text"
                    value={busquedaObservacion}
                    onChange={(e) => setBusquedaObservacion(e.target.value)}
                    placeholder="🔍 Buscar por nombre, documento, turno, servicio u observación..."
                    className="input-field text-lg pr-12"
                  />
                  {busquedaObservacion && (
                    <button
                      onClick={() => setBusquedaObservacion('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {busquedaObservacion && (
                  <p className="text-sm text-gray-600 mt-2">
                    Mostrando {observacionesFiltradas.length} de {observaciones.length} observaciones
                  </p>
                )}
              </div>
            </div>

            {observacionesFiltradas.length === 0 ? (
              <div className="card text-center py-20">
                <p className="text-2xl text-gray-400">
                  {busquedaObservacion 
                    ? 'No se encontraron observaciones' 
                    : 'No hay observaciones registradas'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {observacionesFiltradas.map((obs) => {
                  const esAtendido = obs.estado === 'atendido'
                  const colorEstado = esAtendido 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-red-100 text-red-800 border-red-300'

                  return (
                    <div key={obs.id} className={`card border-2 ${colorEstado}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 flex-1">
                          <div className="bg-hospital-blue text-white rounded-lg p-4 min-w-[120px] text-center">
                            <p className="text-sm opacity-75">Turno</p>
                            <p className="text-2xl font-bold">{obs.numero_turno}</p>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <p className="text-xl font-bold text-hospital-dark">
                                {obs.nombre_paciente}
                              </p>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                esAtendido 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {esAtendido ? 'Atendido' : 'No Responde'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <span>Doc: {obs.documento}</span>
                              <span className="font-semibold">{obs.servicio}</span>
                              {obs.ventanilla && (
                                <span>
                                  {obs.servicio === 'Consulta Médica' ? 'Consultorio' : 'Ventanilla'}: {obs.ventanilla}
                                </span>
                              )}
                              {obs.profesional_codigo && (
                                <span className="text-blue-600">
                                  Por: {obs.profesional_codigo}
                                </span>
                              )}
                            </div>
                            <div className="bg-white/70 rounded-lg p-3 border-l-4 border-purple-500">
                              <p className="text-sm font-semibold text-gray-700 mb-1">
                                💬 Observación:
                              </p>
                              <p className="text-gray-800">{obs.observacion}</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-6">
                          {obs.fecha_atencion && (
                            <>
                              <p className="text-sm text-gray-600 mb-1">Atendido:</p>
                              <p className="text-lg font-semibold text-hospital-dark">
                                {new Date(obs.fecha_atencion).toLocaleDateString('es-CO')}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(obs.fecha_atencion).toLocaleTimeString('es-CO')}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Vista de Análisis con IA */}
        {vistaActual === 'ia' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-hospital-dark mb-4">
                Análisis Inteligente del Servicio
              </h2>
              <p className="text-gray-600 mb-6">
                Genera insights automáticos usando inteligencia artificial de Google Gemini para optimizar el servicio
              </p>

              <div className="space-y-4">
                {/* Indicador de tiempo de espera */}
                {tiempoEspera > 0 && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-900">
                        Espera {tiempoEspera} segundos antes del siguiente análisis
                      </p>
                      <p className="text-sm text-amber-700">
                        Esto previene el error 429 (límite de solicitudes de Gemini)
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 flex-wrap gap-4">
                  <button
                    onClick={() => generarAnalisisIA(25)}
                    disabled={cargandoIA || tiempoEspera > 0}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-lg transition-all shadow-lg flex items-center space-x-3"
                  >
                    <Sparkles className="w-6 h-6" />
                    <span>{cargandoIA ? 'Analizando...' : '⚡ Análisis Rápido (25 turnos)'}</span>
                  </button>

                  <button
                    onClick={() => generarAnalisisIA(50)}
                    disabled={cargandoIA || tiempoEspera > 0}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-lg transition-all shadow-lg flex items-center space-x-3"
                  >
                    <Sparkles className="w-6 h-6" />
                    <span>{cargandoIA ? 'Analizando...' : '📊 Análisis Medio (50 turnos)'}</span>
                  </button>

                  <button
                    onClick={() => generarAnalisisIA(100)}
                    disabled={cargandoIA || tiempoEspera > 0}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-lg transition-all shadow-lg flex items-center space-x-3"
                  >
                    <Sparkles className="w-6 h-6" />
                    <span>{cargandoIA ? 'Analizando...' : '🔍 Análisis Completo (100 turnos)'}</span>
                  </button>

                  {analisisIA && !cargandoIA && (
                    <button
                      onClick={() => setAnalisisIA(null)}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all"
                    >
                      Limpiar Análisis
                    </button>
                  )}
                </div>
              </div>
            </div>

            {cargandoIA && (
              <div className="card text-center py-20">
                <RefreshCw className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
                <p className="text-2xl font-bold text-hospital-dark mb-2">
                  Analizando con Inteligencia Artificial...
                </p>
                <p className="text-gray-600">
                  Google Gemini está procesando los datos. Esto puede tardar unos segundos.
                </p>
              </div>
            )}

            {!cargandoIA && !analisisIA && (
              <div>
                <div className="card text-center py-20 mb-6">
                  <Sparkles className="w-20 h-20 text-purple-600 mx-auto mb-6" />
                  <p className="text-2xl font-bold text-hospital-dark mb-4">
                    Análisis Inteligente del Servicio
                  </p>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Usa inteligencia artificial para obtener insights valiosos sobre:
                    rendimiento de profesionales, tiempos de espera, patrones de no asistencia,
                    y recomendaciones accionables para mejorar el servicio.
                  </p>
                  <p className="text-sm text-purple-600 font-semibold">
                    ✨ Haz click en uno de los botones arriba para comenzar
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Nota sobre Límites de API</h3>
                  <ul className="text-yellow-800 space-y-2 text-sm">
                    <li>• <strong>Análisis Rápido (25 turnos)</strong>: Recomendado para uso frecuente</li>
                    <li>• <strong>Análisis Medio (50 turnos)</strong>: Balance entre detalle y rapidez</li>
                    <li>• <strong>Análisis Completo (100 turnos)</strong>: Más detallado, pero puede alcanzar límites</li>
                    <li>• Si recibes error 429: Espera 1-2 minutos antes de intentar de nuevo</li>
                    <li>• La cuota gratuita de Gemini tiene límites por minuto y por día</li>
                  </ul>
                </div>
              </div>
            )}

            {!cargandoIA && analisisIA && (
              <div className="card">
                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 mb-6 border-l-4 border-purple-600">
                  <div className="flex items-center space-x-3 mb-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">
                      Análisis Generado por Google Gemini 2.5 Flash
                    </h3>
                  </div>
                  <p className="text-sm text-purple-800">
                    Fecha: {new Date().toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="prose prose-lg max-w-none">
                  <div 
                    className="text-gray-800 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: analisisIA
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n### (.*?)\n/g, '<h3 class="text-xl font-bold text-hospital-dark mt-6 mb-3">$1</h3>')
                        .replace(/\n## (.*?)\n/g, '<h2 class="text-2xl font-bold text-purple-600 mt-8 mb-4">$1</h2>')
                        .replace(/\n# (.*?)\n/g, '<h1 class="text-3xl font-bold text-hospital-dark mt-8 mb-6">$1</h1>')
                        .replace(/\n- (.*?)(?=\n|$)/g, '<li class="ml-6 mb-2">• $1</li>')
                        .replace(/\n\n/g, '<br/><br/>')
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista de Sesiones Activas */}
        {vistaActual === 'sesiones' && (
          <div>
            <h2 className="text-2xl font-bold text-hospital-dark mb-6">
              Sesiones Activas ({sesionesActivas.length})
            </h2>

            {sesionesActivas.length === 0 ? (
              <div className="card text-center py-20">
                <p className="text-2xl text-gray-400">
                  No hay sesiones activas
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sesionesActivas.map((sesion, index) => (
                  <div key={index} className="card hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="bg-purple-100 p-4 rounded-lg">
                          <Users className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-hospital-dark">
                            {sesion.nombre_usuario}
                          </p>
                          <p className="text-gray-600">
                            Usuario: {sesion.codigo_usuario}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-lg text-hospital-dark">
                          {sesion.servicio}
                        </p>
                        <p className="text-gray-600">
                          {sesion.servicio === 'Médico' ? 'Consultorio' : 'Ventanilla'}: {sesion.ventanilla}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Desde: {new Date(sesion.fecha_login).toLocaleTimeString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel


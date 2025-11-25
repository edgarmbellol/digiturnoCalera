import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Phone, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react'
import { professionalAPI } from '../services/api'

interface Turno {
  id: number
  numero_turno: string
  nombre_paciente: string
  servicio: string
  condicion_especial: string | null
  es_prioritario?: boolean
  tiempo_espera: string
  rellamado?: number
  estado?: string
  profesional_codigo?: string | null
  ventanilla?: number | null
  profesional_nombre?: string | null
}

const ProfessionalPanel = () => {
  const navigate = useNavigate()
  const [sesion, setSesion] = useState<any>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [rellamados, setRellamados] = useState<Turno[]>([])
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<number | null>(null)
  const [observacion, setObservacion] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [accionModal, setAccionModal] = useState<'atendido' | 'no_responde' | null>(null)
  const [vistaActual, setVistaActual] = useState<'turnos' | 'rellamados'>('turnos')

  useEffect(() => {
    // Verificar sesión
    const sesionGuardada = localStorage.getItem('profesional_session')
    if (!sesionGuardada) {
      navigate('/professional/login')
      return
    }

    const sesionData = JSON.parse(sesionGuardada)
    setSesion(sesionData)

    // Cargar datos iniciales
    cargarTurnos(sesionData.servicio)
    cargarRellamados(sesionData.servicio)

    // Actualizar cada 5 segundos
    const intervalo = setInterval(() => {
      cargarTurnos(sesionData.servicio)
      cargarRellamados(sesionData.servicio)
    }, 5000)

    return () => clearInterval(intervalo)
  }, [navigate])

  const cargarTurnos = async (servicio: string) => {
    try {
      const data = await professionalAPI.obtenerTurnos(servicio)
      setTurnos(data)
    } catch (error) {
      console.error('Error cargando turnos:', error)
    }
  }

  const cargarRellamados = async (servicio: string) => {
    try {
      const data = await professionalAPI.obtenerRellamados(servicio)
      setRellamados(data)
    } catch (error) {
      console.error('Error cargando rellamados:', error)
    }
  }

  const handleLlamarPaciente = async (turnoId: number) => {
    if (!sesion) return

    try {
      await professionalAPI.llamarPaciente({
        turno_id: turnoId,
        ventanilla: sesion.ventanilla,
        codigo_profesional: sesion.codigo_usuario
      })

      // Recargar turnos
      await cargarTurnos(sesion.servicio)
      await cargarRellamados(sesion.servicio)
    } catch (error) {
      console.error('Error llamando paciente:', error)
    }
  }

  const handleAbrirModal = (turnoId: number, accion: 'atendido' | 'no_responde') => {
    setTurnoSeleccionado(turnoId)
    setAccionModal(accion)
    setMostrarModal(true)
  }

  const handleAtender = async () => {
    if (!turnoSeleccionado || !accionModal || !sesion) return

    try {
      await professionalAPI.atenderPaciente({
        turno_id: turnoSeleccionado,
        estado: accionModal,
        observacion: observacion || undefined,
        codigo_profesional: sesion.codigo_usuario
      })

      setMostrarModal(false)
      setObservacion('')
      setTurnoSeleccionado(null)
      setAccionModal(null)

      // Recargar turnos
      await cargarTurnos(sesion.servicio)
      await cargarRellamados(sesion.servicio)
    } catch (error: any) {
      console.error('Error atendiendo paciente:', error)
      // Mostrar mensaje de error al usuario
      const mensaje = error.response?.data?.detail || error.message || 'Error al atender paciente'
      alert(`❌ ${mensaje}`)
    }
  }

  const handleLogout = async () => {
    if (sesion) {
      try {
        await professionalAPI.logout(sesion.sesion_id)
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      }
    }
    localStorage.removeItem('profesional_session')
    navigate('/professional/login')
  }

  if (!sesion) {
    return null
  }

  const turnosMostrar = vistaActual === 'turnos' ? turnos : rellamados

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-hospital-blue text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Logo con fondo blanco destacado */}
              <div className="bg-white rounded-xl p-2 shadow-lg">
                <img src="/logo.png" alt="Hospital Logo" className="h-14 w-auto" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Panel de Profesionales</h1>
                <p className="text-sm opacity-90">
                  {sesion.servicio} - Ventanilla {sesion.ventanilla}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-75">Usuario</p>
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
              onClick={() => setVistaActual('turnos')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all ${
                vistaActual === 'turnos'
                  ? 'border-hospital-blue text-hospital-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Turnos en Espera ({turnos.length})
            </button>
            <button
              onClick={() => setVistaActual('rellamados')}
              className={`px-6 py-4 font-semibold border-b-4 transition-all ${
                vistaActual === 'rellamados'
                  ? 'border-hospital-green text-hospital-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <RefreshCw className="inline w-4 h-4 mr-2" />
              Rellamados ({rellamados.length})
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-8">
        {turnosMostrar.length === 0 ? (
          <div className="card text-center py-20">
            <p className="text-2xl text-gray-400">
              {vistaActual === 'turnos' 
                ? 'No hay turnos en espera' 
                : 'No hay pacientes para rellamar'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {turnosMostrar.map((turno) => {
              const esLlamado = turno.estado === 'llamado'
              const esMiLlamado = esLlamado && turno.profesional_codigo === sesion?.codigo_usuario
              const otroProfesionalLlamando = esLlamado && !esMiLlamado
              
              return (
                <div 
                  key={turno.id} 
                  className={`card hover:shadow-2xl transition-all relative ${
                    turno.es_prioritario 
                      ? 'border-4 border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 ring-2 ring-purple-300' 
                      : esLlamado 
                        ? esMiLlamado
                          ? 'border-4 border-hospital-blue bg-blue-50' 
                          : 'border-4 border-orange-500 bg-orange-50'
                        : ''
                  }`}
                >
                  {/* Indicador de prioridad */}
                  {turno.es_prioritario && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-br from-purple-600 to-purple-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-pulse">
                      <span className="text-2xl">♿</span>
                      <span className="font-bold text-sm">PRIORITARIO</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className={`rounded-lg p-4 min-w-[120px] text-center ${
                        turno.es_prioritario
                          ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white'
                          : esLlamado 
                            ? esMiLlamado
                              ? 'bg-hospital-blue text-white animate-pulse' 
                              : 'bg-orange-500 text-white'
                            : 'bg-hospital-blue text-white'
                      }`}>
                        <p className="text-sm opacity-75">Turno</p>
                        <p className="text-3xl font-bold">{turno.numero_turno}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <p className={`text-2xl font-bold ${
                            turno.es_prioritario ? 'text-purple-900' : 'text-hospital-dark'
                          }`}>
                            {turno.nombre_paciente}
                          </p>
                          {esLlamado && (
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              esMiLlamado
                                ? 'bg-hospital-blue text-white animate-pulse'
                                : 'bg-orange-500 text-white'
                            }`}>
                              {esMiLlamado ? 'LLAMANDO...' : 'SIENDO LLAMADO'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {turno.es_prioritario && (
                            <span className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-4 py-1 rounded-full font-bold text-base shadow-md">
                              ♿ Atención Prioritaria
                            </span>
                          )}
                          {turno.condicion_especial && turno.condicion_especial !== 'Ninguna' && !turno.es_prioritario && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                              {turno.condicion_especial}
                            </span>
                          )}
                          {otroProfesionalLlamando && (
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold border-2 border-orange-500">
                              📞 {turno.profesional_nombre || turno.profesional_codigo} - Ventanilla {turno.ventanilla}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Esperando: {turno.tiempo_espera}
                          </span>
                          {turno.rellamado !== undefined && turno.rellamado > 0 && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
                              Rellamado {turno.rellamado}x
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {!esLlamado ? (
                        <button
                          onClick={() => handleLlamarPaciente(turno.id)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Phone className="w-5 h-5" />
                          <span>Llamar</span>
                        </button>
                      ) : esMiLlamado ? (
                        <>
                          <button
                            onClick={() => handleAbrirModal(turno.id, 'atendido')}
                            className="btn-secondary flex items-center space-x-2 text-lg px-8"
                          >
                            <CheckCircle className="w-6 h-6" />
                            <span>Atendido</span>
                          </button>
                          <button
                            onClick={() => handleAbrirModal(turno.id, 'no_responde')}
                            className="btn-danger flex items-center space-x-2 text-lg px-8"
                          >
                            <XCircle className="w-6 h-6" />
                            <span>No Responde</span>
                          </button>
                        </>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-500 cursor-not-allowed px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
                          title={`Este paciente está siendo llamado por ${turno.profesional_nombre || turno.profesional_codigo} en la ventanilla ${turno.ventanilla}`}
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Otro profesional llamando</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-hospital-dark mb-4">
              {accionModal === 'atendido' ? 'Marcar como Atendido' : 'Paciente No Responde'}
            </h3>
            <p className="text-gray-600 mb-6">
              {accionModal === 'atendido'
                ? '¿Confirma que el paciente fue atendido?'
                : 'El paciente será marcado como "No Responde" y podrá ser rellamado.'}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observación {accionModal === 'no_responde' ? '(requerido)' : '(opcional)'}
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Ingrese una observación..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setMostrarModal(false)
                  setObservacion('')
                  setTurnoSeleccionado(null)
                  setAccionModal(null)
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAtender}
                className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-all ${
                  accionModal === 'atendido'
                    ? 'btn-secondary'
                    : 'btn-danger'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfessionalPanel


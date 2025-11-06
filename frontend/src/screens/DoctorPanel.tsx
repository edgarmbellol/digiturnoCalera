import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Phone, CheckCircle, XCircle, Search, Calendar, AlertCircle } from 'lucide-react'
import { doctorAPI } from '../services/api'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'

interface Cita {
  secuencia: number
  fecha: string
  hora: string
  profesional: string
  documento: string
  nombre_paciente: string
  indicador: number | null
  estado_cita: string
  en_espera: boolean
  facturado: boolean
  estado_turno?: string
}

const DoctorPanel = () => {
  const navigate = useNavigate()
  const [sesion, setSesion] = useState<any>(null)
  const [citas, setCitas] = useState<Cita[]>([])
  const [citasFiltradas, setCitasFiltradas] = useState<Cita[]>([])
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [busqueda, setBusqueda] = useState('')
  const [citaSeleccionada, setCitaSeleccionada] = useState<number | null>(null)
  const [observacion, setObservacion] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [accionModal, setAccionModal] = useState<'atendido' | 'no_responde' | null>(null)

  useEffect(() => {
    // Verificar sesión
    const sesionGuardada = localStorage.getItem('doctor_session')
    if (!sesionGuardada) {
      navigate('/doctor/login')
      return
    }

    const sesionData = JSON.parse(sesionGuardada)
    setSesion(sesionData)

    // Cargar agenda
    cargarAgenda(sesionData.codigo_usuario, fechaSeleccionada)

    // Actualizar cada 10 segundos
    const intervalo = setInterval(() => {
      cargarAgenda(sesionData.codigo_usuario, fechaSeleccionada)
    }, 10000)

    return () => clearInterval(intervalo)
  }, [navigate, fechaSeleccionada])

  useEffect(() => {
    // Filtrar citas por búsqueda
    if (!busqueda) {
      setCitasFiltradas(citas)
      return
    }

    const busquedaLower = busqueda.toLowerCase()
    const filtradas = citas.filter(
      (cita) =>
        cita.nombre_paciente.toLowerCase().includes(busquedaLower) ||
        cita.documento.includes(busqueda)
    )
    setCitasFiltradas(filtradas)
  }, [busqueda, citas])

  const cargarAgenda = async (codigoProfesional: string, fecha: string) => {
    try {
      const data = await doctorAPI.obtenerAgenda(codigoProfesional, fecha)
      setCitas(data)
      setCitasFiltradas(data)
    } catch (error) {
      console.error('Error cargando agenda:', error)
    }
  }


  const handleLlamarPaciente = async (citaId: number) => {
    if (!sesion) return

    try {
      await doctorAPI.llamarPaciente({
        turno_id: citaId,
        ventanilla: sesion.ventanilla,
        codigo_profesional: sesion.codigo_usuario
      })

      // Recargar agenda
      await cargarAgenda(sesion.codigo_usuario, fechaSeleccionada)
    } catch (error) {
      console.error('Error llamando paciente:', error)
    }
  }

  const handleAbrirModal = (citaId: number, accion: 'atendido' | 'no_responde') => {
    setCitaSeleccionada(citaId)
    setAccionModal(accion)
    setMostrarModal(true)
  }

  const handleAtender = async () => {
    if (!citaSeleccionada || !accionModal || !sesion) return

    try {
      // Primero, encontrar el turno real (no la secuencia de cita)
      // citaSeleccionada es en realidad la secuencia de la cita
      const cita = citas.find(c => c.secuencia === citaSeleccionada)
      if (!cita) {
        console.error('Cita no encontrada')
        return
      }

      // Buscar el turno asociado por documento
      const response = await doctorAPI.atenderPaciente({
        turno_id: citaSeleccionada,
        estado: accionModal,
        observacion: observacion || undefined
      })

      setMostrarModal(false)
      setObservacion('')
      setCitaSeleccionada(null)
      setAccionModal(null)

      // Recargar agenda para actualizar estados
      await cargarAgenda(sesion.codigo_usuario, fechaSeleccionada)
    } catch (error) {
      console.error('Error atendiendo paciente:', error)
      alert('Error al atender paciente. Por favor intente de nuevo.')
    }
  }

  const handleLogout = async () => {
    if (sesion) {
      try {
        await doctorAPI.logout(sesion.sesion_id)
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      }
    }
    localStorage.removeItem('doctor_session')
    navigate('/doctor/login')
  }

  if (!sesion) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-hospital-green text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Logo con fondo blanco destacado */}
              <div className="bg-white rounded-xl p-2 shadow-lg">
                <img src="/logo.png" alt="Hospital Logo" className="h-14 w-auto" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Panel de Médicos</h1>
                <p className="text-sm opacity-90">
                  Consultorio {sesion.ventanilla}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-75">Médico</p>
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

      {/* Filtros */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o documento..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-hospital-green focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="text-gray-600 w-5 h-5" />
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-hospital-green focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-hospital-dark">
            Agenda del{' '}
            {format(new Date(fechaSeleccionada + 'T00:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", {
              locale: es
            })}
          </h2>
          <div className="text-lg font-semibold text-gray-600">
            Total: {citasFiltradas.length} citas
          </div>
        </div>

        {citasFiltradas.length === 0 ? (
          <div className="card text-center py-20">
            <p className="text-2xl text-gray-400">
              {busqueda ? 'No se encontraron citas' : 'No hay citas programadas para esta fecha'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {citasFiltradas.map((cita) => {
              const esLlamado = cita.estado_turno === 'llamado'
              
              return (
                <div
                  key={cita.secuencia}
                  className={`card hover:shadow-2xl transition-all ${
                    esLlamado ? 'border-4 border-hospital-blue bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className={`rounded-lg p-4 min-w-[100px] text-center ${
                        esLlamado 
                          ? 'bg-hospital-blue text-white animate-pulse' 
                          : 'bg-hospital-green text-white'
                      }`}>
                        <p className="text-sm opacity-75">Hora</p>
                        <p className="text-2xl font-bold">{cita.hora}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="text-2xl font-bold text-hospital-dark">
                            {cita.nombre_paciente}
                          </p>
                          {esLlamado && (
                            <span className="bg-hospital-blue text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                              LLAMANDO...
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          Documento: {cita.documento}
                        </p>
                        <p className="text-sm text-gray-500">
                          Estado: {cita.estado_cita} | Secuencia: {cita.secuencia}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {!esLlamado ? (
                        <button
                          onClick={() => handleLlamarPaciente(cita.secuencia)}
                          className="btn-primary flex items-center space-x-2 px-8"
                        >
                          <Phone className="w-5 h-5" />
                          <span>Llamar Paciente</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAbrirModal(cita.secuencia, 'atendido')}
                            className="btn-secondary flex items-center space-x-2 text-lg px-8"
                          >
                            <CheckCircle className="w-6 h-6" />
                            <span>Atendido</span>
                          </button>
                          <button
                            onClick={() => handleAbrirModal(cita.secuencia, 'no_responde')}
                            className="btn-danger flex items-center space-x-2 text-lg px-8"
                          >
                            <XCircle className="w-6 h-6" />
                            <span>No Responde</span>
                          </button>
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
                : 'El paciente será marcado como "No Responde".'}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observación (opcional)
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
                  setCitaSeleccionada(null)
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

export default DoctorPanel


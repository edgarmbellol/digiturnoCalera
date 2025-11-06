import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { kioskAPI } from '../services/api'

interface Turno {
  numero_turno: string
  nombre_paciente: string
  servicio: string
}

const KioskScreen = () => {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [documento, setDocumento] = useState('')
  const [nombrePaciente, setNombrePaciente] = useState('Usuario')
  const [servicioSeleccionado, setServicioSeleccionado] = useState('')
  const [condicionSeleccionada, setCondicionSeleccionada] = useState('Ninguna')
  const [servicios, setServicios] = useState<string[]>([])
  const [condiciones, setCondiciones] = useState<string[]>([])
  const [turnoCreado, setTurnoCreado] = useState<Turno | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [resServicios, resCondiciones] = await Promise.all([
        kioskAPI.obtenerServicios(),
        kioskAPI.obtenerCondiciones()
      ])
      setServicios(resServicios.servicios)
      setCondiciones(resCondiciones.condiciones)
    } catch (err) {
      console.error('Error cargando datos:', err)
    }
  }

  const handleSiguiente = async () => {
    if (paso === 1) {
      if (documento.length < 5) {
        setError('Por favor ingrese un número de documento válido')
        return
      }
      setError('')
      setLoading(true)
      
      try {
        // Buscar el paciente en la base de datos
        const resultado = await kioskAPI.buscarPaciente(documento)
        setNombrePaciente(resultado.nombre)
        setPaso(2)
      } catch (err) {
        console.error('Error buscando paciente:', err)
        setNombrePaciente('Usuario')
        setPaso(2)
      } finally {
        setLoading(false)
      }
    } else if (paso === 2) {
      if (!servicioSeleccionado) {
        setError('Por favor seleccione un servicio')
        return
      }
      setError('')
      setPaso(3)
    } else if (paso === 3) {
      await registrarTurno()
    }
  }

  const registrarTurno = async () => {
    setLoading(true)
    setError('')
    
    try {
      const resultado = await kioskAPI.registrarTurno({
        documento,
        servicio: servicioSeleccionado,
        condicion_especial: condicionSeleccionada
      })
      
      setTurnoCreado({
        numero_turno: resultado.numero_turno,
        nombre_paciente: resultado.nombre_paciente,
        servicio: resultado.servicio
      })
      setPaso(4)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrar el turno')
    } finally {
      setLoading(false)
    }
  }

  const handleReiniciar = () => {
    setDocumento('')
    setNombrePaciente('Usuario')
    setServicioSeleccionado('')
    setCondicionSeleccionada('Ninguna')
    setTurnoCreado(null)
    setError('')
    setPaso(1)
  }

  const handleNumeroClick = (numero: string) => {
    if (documento.length < 15) {
      setDocumento(documento + numero)
    }
  }

  const handleBorrar = () => {
    setDocumento(documento.slice(0, -1))
  }

  const handleLimpiar = () => {
    setDocumento('')
  }

  return (
    <div className="h-screen bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 p-3 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        {/* Header Mejorado */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-4 mb-3 border border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Logo con mejor diseño */}
              <div className="bg-white rounded-xl p-2 shadow-lg">
                <img src="/logo.png" alt="Hospital Logo" className="h-12 w-auto" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold tracking-tight">Sistema de Turnos</h1>
                <p className="text-sm opacity-90 font-medium">Hospital Divino Salvador de Sopó</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
              aria-label="Volver al inicio"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Indicador de pasos mejorado */}
        <div className="bg-white rounded-2xl shadow-xl p-5 mb-3">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Documento', icon: '📝' },
              { num: 2, label: 'Servicio', icon: '🏥' },
              { num: 3, label: 'Condición', icon: '✓' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                {/* Paso */}
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all shadow-lg ${
                      paso >= step.num
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110'
                        : paso === step.num - 1
                        ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <span className="text-2xl">{paso >= step.num ? '✓' : step.icon}</span>
                  </div>
                  <p className={`mt-2 text-sm font-semibold ${
                    paso >= step.num ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
                
                {/* Línea conectora */}
                {index < 2 && (
                  <div className="flex-1 h-1 mx-3 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className={`h-full transition-all duration-500 ${
                        paso > step.num ? 'bg-gradient-to-r from-green-400 to-green-600 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="card flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Paso 1: Documento */}
          {paso === 1 && (
            <div className="flex-1 flex items-center">
              <div className="w-full grid grid-cols-2 gap-8">
                {/* Columna izquierda: Título y Display */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-hospital-dark mb-6 text-center">
                    Ingrese su número de documento
                  </h2>
                  
                  {/* Display del documento */}
                  <div className="bg-gray-100 border-4 border-hospital-blue rounded-xl p-6 mb-6 text-center">
                    <p className="text-5xl font-bold text-hospital-dark tracking-wider min-h-[60px] flex items-center justify-center">
                      {documento || <span className="text-gray-400">_ _ _ _ _ _</span>}
                    </p>
                  </div>

                  {/* Botón siguiente */}
                  <button
                    onClick={handleSiguiente}
                    disabled={documento.length < 5 || loading}
                    className="btn-primary text-2xl py-5 px-12 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                  >
                    {loading ? 'Buscando...' : (
                      <>
                        Siguiente <ArrowRight className="inline ml-2" />
                      </>
                    )}
                  </button>
                </div>

                {/* Columna derecha: Teclado numérico */}
                <div className="flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumeroClick(num.toString())}
                        className="bg-white hover:bg-hospital-blue hover:text-white text-hospital-dark font-bold text-3xl py-6 rounded-xl shadow-lg transition-all active:scale-95 border-2 border-gray-200 hover:border-hospital-blue w-20 h-20"
                      >
                        {num}
                      </button>
                    ))}
                    
                    {/* Fila inferior: Limpiar, 0, Borrar */}
                    <button
                      onClick={handleLimpiar}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg transition-all active:scale-95 w-20 h-20 flex items-center justify-center"
                    >
                      CLR
                    </button>
                    <button
                      onClick={() => handleNumeroClick('0')}
                      className="bg-white hover:bg-hospital-blue hover:text-white text-hospital-dark font-bold text-3xl py-6 rounded-xl shadow-lg transition-all active:scale-95 border-2 border-gray-200 hover:border-hospital-blue w-20 h-20"
                    >
                      0
                    </button>
                    <button
                      onClick={handleBorrar}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg transition-all active:scale-95 w-20 h-20 flex items-center justify-center"
                    >
                      ←
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Servicio */}
          {paso === 2 && (
            <div className="flex-1 flex flex-col justify-center">
              {/* Mensaje de bienvenida */}
              <div className="text-center mb-4">
                <p className="text-2xl text-hospital-blue font-semibold">
                  ¡Bienvenido {nombrePaciente}!
                </p>
              </div>
              
              <h2 className="text-3xl font-bold text-hospital-dark mb-6 text-center">
                Seleccione el servicio
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {servicios.map((servicio) => (
                  <button
                    key={servicio}
                    onClick={() => setServicioSeleccionado(servicio)}
                    className={`p-6 rounded-xl text-xl font-semibold transition-all ${
                      servicioSeleccionado === servicio
                        ? 'bg-hospital-blue text-white shadow-2xl scale-105'
                        : 'bg-gray-100 text-hospital-dark hover:bg-gray-200'
                    }`}
                  >
                    {servicio}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setPaso(1)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-8 rounded-lg text-lg"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSiguiente}
                  className="btn-primary text-lg py-3 px-10"
                >
                  Siguiente <ArrowRight className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Condición especial */}
          {paso === 3 && (
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-hospital-dark mb-6 text-center">
                ¿Tiene alguna condición especial?
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {condiciones.map((condicion) => (
                  <button
                    key={condicion}
                    onClick={() => setCondicionSeleccionada(condicion)}
                    className={`p-6 rounded-xl text-xl font-semibold transition-all ${
                      condicionSeleccionada === condicion
                        ? 'bg-hospital-green text-white shadow-2xl scale-105'
                        : 'bg-gray-100 text-hospital-dark hover:bg-gray-200'
                    }`}
                  >
                    {condicion}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setPaso(2)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-8 rounded-lg text-lg"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSiguiente}
                  disabled={loading}
                  className="btn-secondary text-lg py-3 px-10"
                >
                  {loading ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Confirmación */}
          {paso === 4 && turnoCreado && (
            <div className="flex-1 flex flex-col justify-center items-center">
              <CheckCircle className="w-24 h-24 text-hospital-green mb-4" />
              <h2 className="text-4xl font-bold text-hospital-dark mb-6">
                ¡Turno registrado!
              </h2>
              <div className="bg-hospital-blue text-white p-8 rounded-2xl mb-6 text-center shadow-2xl">
                <p className="text-2xl mb-3">Su número de turno es:</p>
                <p className="text-6xl font-bold mb-4">{turnoCreado.numero_turno}</p>
                <p className="text-xl mb-2">{turnoCreado.nombre_paciente}</p>
                <p className="text-lg opacity-90">{turnoCreado.servicio}</p>
              </div>
              <p className="text-xl text-gray-600 mb-6 text-center">
                Por favor espere a que sea llamado en la pantalla
              </p>
              <button
                onClick={handleReiniciar}
                className="btn-primary text-lg py-3 px-10"
              >
                Registrar otro turno
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KioskScreen


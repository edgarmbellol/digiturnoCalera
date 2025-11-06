import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, LogIn } from 'lucide-react'
import { doctorAPI, adminAPI } from '../services/api'

const DoctorLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    codigo_usuario: '',
    clave: '',
    ventanilla: 1
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [numConsultorios, setNumConsultorios] = useState(5)

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const config = await adminAPI.obtenerConfiguracion()
      const consultaMedica = config.find((c: any) => c.servicio === 'Consulta Médica')
      if (consultaMedica) {
        setNumConsultorios(consultaMedica.num_ventanillas)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.codigo_usuario || !formData.clave) {
      setError('Por favor complete todos los campos')
      return
    }

    setLoading(true)

    try {
      const response = await doctorAPI.login({
        ...formData,
        servicio: 'Médico'
      })
      
      if (response.success) {
        // Guardar sesión en localStorage
        localStorage.setItem('doctor_session', JSON.stringify({
          sesion_id: response.sesion_id,
          codigo_usuario: response.codigo_usuario,
          servicio: 'Médico',
          ventanilla: formData.ventanilla
        }))
        
        navigate('/doctor/panel')
      } else {
        setError(response.message)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-hospital-green flex items-center justify-center p-8">
      <button
        onClick={() => navigate('/')}
        className="fixed top-8 right-8 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all"
        aria-label="Volver al inicio"
      >
        <Home className="w-6 h-6" />
      </button>

      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          {/* Logo con fondo blanco destacado */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 inline-block shadow-lg mb-4">
            <img src="/logo.png" alt="Hospital Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-hospital-dark mb-2">
            Panel de Médicos
          </h1>
          <p className="text-gray-600">
            Ingrese sus credenciales para continuar
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código de Profesional
            </label>
            <input
              type="text"
              value={formData.codigo_usuario}
              onChange={(e) => setFormData({ ...formData, codigo_usuario: e.target.value })}
              className="input-field"
              placeholder="Código de médico"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={formData.clave}
              onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Consultorio
            </label>
            <select
              value={formData.ventanilla}
              onChange={(e) => setFormData({ ...formData, ventanilla: parseInt(e.target.value) })}
              className="input-field"
            >
              {Array.from({ length: numConsultorios }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  Consultorio {num}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-secondary w-full text-lg"
          >
            {loading ? (
              'Iniciando sesión...'
            ) : (
              <>
                <LogIn className="inline mr-2 w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default DoctorLogin


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, LogIn } from 'lucide-react'
import { professionalAPI, adminAPI } from '../services/api'

const ProfessionalLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    codigo_usuario: '',
    clave: '',
    servicio: '',
    ventanilla: 1
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [servicios, setServicios] = useState<Array<{ nombre: string, ventanillas: number }>>([])

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const config = await adminAPI.obtenerConfiguracion()
      const serviciosFiltrados = config
        .filter((c: any) => c.servicio !== 'Consulta Médica' && c.activo)
        .map((c: any) => ({
          nombre: c.servicio,
          ventanillas: c.num_ventanillas
        }))
      setServicios(serviciosFiltrados)
    } catch (error) {
      console.error('Error cargando configuración:', error)
      // Fallback a configuración por defecto
      setServicios([
        { nombre: 'Citas Médicas', ventanillas: 2 },
        { nombre: 'Facturación', ventanillas: 3 },
        { nombre: 'Famisanar', ventanillas: 1 },
        { nombre: 'Nueva EPS', ventanillas: 1 }
      ])
    }
  }

  const servicioSeleccionado = servicios.find(s => s.nombre === formData.servicio)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.codigo_usuario || !formData.clave || !formData.servicio) {
      setError('Por favor complete todos los campos')
      return
    }

    setLoading(true)

    try {
      const response = await professionalAPI.login(formData)
      
      if (response.success) {
        // Guardar sesión en localStorage
        localStorage.setItem('profesional_session', JSON.stringify({
          sesion_id: response.sesion_id,
          codigo_usuario: response.codigo_usuario,
          servicio: response.servicio,
          ventanilla: response.ventanilla
        }))
        
        navigate('/professional/panel')
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
    <div className="min-h-screen bg-gradient-to-br from-hospital-blue to-hospital-cyan flex items-center justify-center p-8">
      <button
        onClick={() => navigate('/')}
        className="fixed top-8 right-8 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all"
        aria-label="Volver al inicio"
      >
        <Home className="w-6 h-6" />
      </button>

      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          {/* Logo con fondo destacado */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-4 inline-block shadow-lg mb-4">
            <img src="/logo.png" alt="Hospital Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-hospital-dark mb-2">
            Panel de Profesionales
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
              Usuario
            </label>
            <input
              type="text"
              value={formData.codigo_usuario}
              onChange={(e) => setFormData({ ...formData, codigo_usuario: e.target.value })}
              className="input-field"
              placeholder="Código de usuario"
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
              Servicio
            </label>
            <select
              value={formData.servicio}
              onChange={(e) => setFormData({ ...formData, servicio: e.target.value, ventanilla: 1 })}
              className="input-field"
            >
              <option value="">Seleccione un servicio</option>
              {servicios.map((servicio) => (
                <option key={servicio.nombre} value={servicio.nombre}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div>

          {servicioSeleccionado && servicioSeleccionado.ventanillas > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ventanilla
              </label>
              <select
                value={formData.ventanilla}
                onChange={(e) => setFormData({ ...formData, ventanilla: parseInt(e.target.value) })}
                className="input-field"
              >
                {Array.from({ length: servicioSeleccionado.ventanillas }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Ventanilla {num}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg"
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

export default ProfessionalLogin


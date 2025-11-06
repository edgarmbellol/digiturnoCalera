import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, LogIn, Shield } from 'lucide-react'
import { adminAPI } from '../services/api'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    codigo_usuario: '',
    clave: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.codigo_usuario || !formData.clave) {
      setError('Por favor complete todos los campos')
      return
    }

    setLoading(true)

    try {
      const response = await adminAPI.login(formData)
      
      if (response.success) {
        // Guardar sesión en localStorage
        localStorage.setItem('admin_session', JSON.stringify({
          sesion_id: response.sesion_id,
          codigo_usuario: response.codigo_usuario,
          servicio: 'Administrador'
        }))
        
        navigate('/admin/panel')
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-8">
      <button
        onClick={() => navigate('/')}
        className="fixed top-8 right-8 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all"
        aria-label="Volver al inicio"
      >
        <Home className="w-6 h-6" />
      </button>

      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <Shield className="w-12 h-12 text-purple-600" />
            </div>
          </div>
          {/* Logo con fondo destacado */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-4 inline-block shadow-lg mb-4">
            <img src="/logo.png" alt="Hospital Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-hospital-dark mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestión y configuración del sistema
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
              Usuario Administrador
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg text-lg"
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

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Solo usuarios autorizados pueden acceder</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin


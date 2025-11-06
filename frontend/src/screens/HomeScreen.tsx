import { useNavigate } from 'react-router-dom'
import { Monitor, Stethoscope, Users, Tv, Shield } from 'lucide-react'

const HomeScreen = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-hospital-blue to-hospital-cyan flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {/* Logo con fondo blanco destacado */}
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <img src="/logo.png" alt="Hospital Logo" className="h-28 w-auto" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Sistema de Digiturno
          </h1>
          <p className="text-2xl text-white/90">
            Hospital Divino Salvador de Sopó
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/kiosk')}
            className="card hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8"
            tabIndex={0}
            aria-label="Kiosco de Registro"
          >
            <Monitor className="w-16 h-16 text-hospital-blue mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-hospital-dark mb-2">
              Kiosco de Registro
            </h2>
            <p className="text-gray-600">
              Registrar nuevo turno para pacientes
            </p>
          </button>

          <button
            onClick={() => navigate('/display')}
            className="card hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8"
            tabIndex={0}
            aria-label="Pantalla de Espera"
          >
            <Tv className="w-16 h-16 text-hospital-green mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-hospital-dark mb-2">
              Pantalla de Espera
            </h2>
            <p className="text-gray-600">
              Visualización de llamados
            </p>
          </button>

          <button
            onClick={() => navigate('/professional/login')}
            className="card hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8"
            tabIndex={0}
            aria-label="Panel de Profesionales"
          >
            <Users className="w-16 h-16 text-hospital-cyan mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-hospital-dark mb-2">
              Panel de Profesionales
            </h2>
            <p className="text-gray-600">
              Facturación, Famisanar, Nueva EPS
            </p>
          </button>

          <button
            onClick={() => navigate('/doctor/login')}
            className="card hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8"
            tabIndex={0}
            aria-label="Panel de Médicos"
          >
            <Stethoscope className="w-16 h-16 text-green-600 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-hospital-dark mb-2">
              Panel de Médicos
            </h2>
            <p className="text-gray-600">
              Gestión de agenda y consultas
            </p>
          </button>

          <button
            onClick={() => navigate('/admin/login')}
            className="card hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8"
            tabIndex={0}
            aria-label="Panel de Administración"
          >
            <Shield className="w-16 h-16 text-purple-600 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-hospital-dark mb-2">
              Administración
            </h2>
            <p className="text-gray-600">
              Configuración y estadísticas
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen


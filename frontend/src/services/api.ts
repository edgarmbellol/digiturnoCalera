import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Kiosk API
export const kioskAPI = {
  registrarTurno: async (data: {
    documento: string
    servicio: string
    condicion_especial?: string
  }) => {
    const response = await api.post('/kiosk/registro', data)
    return response.data
  },
  
  obtenerServicios: async () => {
    const response = await api.get('/kiosk/servicios')
    return response.data
  },
  
  obtenerCondiciones: async () => {
    const response = await api.get('/kiosk/condiciones')
    return response.data
  },
  
  buscarPaciente: async (documento: string) => {
    const response = await api.get(`/kiosk/buscar-paciente/${documento}`)
    return response.data
  },
}

// Professional API
export const professionalAPI = {
  login: async (data: {
    codigo_usuario: string
    clave: string
    servicio: string
    ventanilla: number
  }) => {
    const response = await api.post('/professional/login', data)
    return response.data
  },
  
  obtenerTurnos: async (servicio: string) => {
    const response = await api.get(`/professional/turnos/${servicio}`)
    return response.data
  },
  
  llamarPaciente: async (data: {
    turno_id: number
    ventanilla: number
    codigo_profesional: string
  }) => {
    const response = await api.post('/professional/llamar', data)
    return response.data
  },
  
  atenderPaciente: async (data: {
    turno_id: number
    estado: string
    observacion?: string
    codigo_profesional?: string
  }) => {
    const response = await api.post('/professional/atender', data)
    return response.data
  },
  
  obtenerRellamados: async (servicio: string) => {
    const response = await api.get(`/professional/rellamados/${servicio}`)
    return response.data
  },
  
  logout: async (sesion_id: number) => {
    const response = await api.post(`/professional/logout/${sesion_id}`)
    return response.data
  },
}

// Doctor API
export const doctorAPI = {
  login: async (data: {
    codigo_usuario: string
    clave: string
    servicio: string
    ventanilla: number
  }) => {
    const response = await api.post('/doctor/login', data)
    return response.data
  },
  
  obtenerAgenda: async (codigo_profesional: string, fecha?: string) => {
    const params = fecha ? `?fecha=${fecha}` : ''
    const response = await api.get(`/doctor/agenda/${codigo_profesional}${params}`)
    return response.data
  },
  
  marcarFacturado: async (data: {
    secuencia_cita: number
    documento: string
  }) => {
    const response = await api.post('/doctor/marcar-facturado', data)
    return response.data
  },
  
  llamarPaciente: async (data: {
    turno_id: number
    ventanilla: number
    codigo_profesional: string
  }) => {
    const response = await api.post('/doctor/llamar-paciente', data)
    return response.data
  },
  
  atenderPaciente: async (data: {
    turno_id: number
    estado: string
    observacion?: string
  }) => {
    const response = await api.post('/doctor/atender', data)
    return response.data
  },
  
  logout: async (sesion_id: number) => {
    const response = await api.post(`/doctor/logout/${sesion_id}`)
    return response.data
  },
}

// Display API
export const displayAPI = {
  obtenerLlamadosRecientes: async (limit: number = 5) => {
    const response = await api.get(`/display/llamados-recientes?limit=${limit}`)
    return response.data
  },
  
  obtenerUltimoLlamado: async () => {
    const response = await api.get('/display/ultimo-llamado')
    return response.data
  },
  
  obtenerNuevosLlamados: async () => {
    const response = await api.get('/display/nuevos-llamados')
    return response.data
  },
  
  obtenerTurnosEnEspera: async () => {
    const response = await api.get('/display/turnos-en-espera')
    return response.data
  },
  
  obtenerEstadisticas: async () => {
    const response = await api.get('/display/estadisticas')
    return response.data
  },
}

// Admin API
export const adminAPI = {
  login: async (data: {
    codigo_usuario: string
    clave: string
  }) => {
    const response = await api.post('/admin/login', {
      ...data,
      servicio: 'Administrador',
      ventanilla: 0
    })
    return response.data
  },
  
  obtenerConfiguracion: async () => {
    const response = await api.get('/admin/configuracion')
    return response.data
  },
  
  actualizarVentanillas: async (data: {
    servicio: string
    num_ventanillas: number
  }) => {
    const response = await api.post('/admin/actualizar-ventanillas', data)
    return response.data
  },
  
  renombrarServicio: async (data: {
    servicio_actual: string
    servicio_nuevo: string
  }) => {
    const response = await api.post('/admin/renombrar-servicio', data)
    return response.data
  },
  
  agregarServicio: async (data: {
    nombre: string
    num_ventanillas: number
  }) => {
    const response = await api.post('/admin/agregar-servicio', data)
    return response.data
  },
  
  eliminarServicio: async (servicio: string) => {
    const response = await api.post(`/admin/eliminar-servicio/${servicio}`)
    return response.data
  },
  
  obtenerEstadisticas: async () => {
    const response = await api.get('/admin/estadisticas')
    return response.data
  },
  
  obtenerPacientesEnEspera: async () => {
    const response = await api.get('/admin/pacientes-en-espera')
    return response.data
  },
  
  obtenerObservaciones: async () => {
    const response = await api.get('/admin/observaciones')
    return response.data
  },
  
  obtenerSesionesActivas: async () => {
    const response = await api.get('/admin/sesiones-activas')
    return response.data
  },
  
  logout: async (sesion_id: number) => {
    const response = await api.post(`/admin/logout/${sesion_id}`)
    return response.data
  },
}

// AI API
export const aiAPI = {
  analizarTurnos: async (limit: number = 100) => {
    const response = await api.get(`/ai/analizar-turnos?limit=${limit}`)
    return response.data
  },
  
  analizarServicio: async (servicio: string, limit: number = 50) => {
    const response = await api.get(`/ai/analizar-servicio/${servicio}?limit=${limit}`)
    return response.data
  },
}

export default api


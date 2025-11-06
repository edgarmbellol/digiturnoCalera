import { useState, useEffect, useRef } from 'react'
import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { displayAPI } from '../services/api'

interface Llamado {
  id: number
  numero_turno: string
  nombre_paciente: string
  servicio: string
  ventanilla: number
  fecha_llamado?: string
  texto_anuncio?: string
}

const DisplayScreen = () => {
  const navigate = useNavigate()
  const [llamados, setLlamados] = useState<Llamado[]>([])
  const [llamadosActivos, setLlamadosActivos] = useState<Llamado[]>([])
  const [horaActual, setHoraActual] = useState(new Date())
  const [vozActivada, setVozActivada] = useState(false)
  const colaAnunciosRef = useRef<string[]>([])
  const anunciandoRef = useRef(false)

  // Inicializar y activar voz
  useEffect(() => {
    const inicializarVoz = async () => {
      if ('speechSynthesis' in window) {
        // Esperar a que las voces se carguen
        const cargarVoces = () => {
          const voces = window.speechSynthesis.getVoices()
          console.log('✅ Voces disponibles:', voces.length)
          if (voces.length > 0) {
            setVozActivada(true)
          }
        }

        if (window.speechSynthesis.getVoices().length > 0) {
          cargarVoces()
        } else {
          window.speechSynthesis.addEventListener('voiceschanged', cargarVoces, { once: true })
        }

        // Activar con primer click/touch
        const activarConInteraccion = () => {
          console.log('🔊 Activando voz con interacción del usuario')
          const test = new SpeechSynthesisUtterance('')
          test.volume = 0
          window.speechSynthesis.speak(test)
          setVozActivada(true)
        }

        document.addEventListener('click', activarConInteraccion, { once: true })
        document.addEventListener('touchstart', activarConInteraccion, { once: true })

        return () => {
          document.removeEventListener('click', activarConInteraccion)
          document.removeEventListener('touchstart', activarConInteraccion)
        }
      }
    }

    inicializarVoz()
  }, [])

  // Actualizar hora
  useEffect(() => {
    const intervaloHora = setInterval(() => {
      setHoraActual(new Date())
    }, 1000)

    return () => clearInterval(intervaloHora)
  }, [])

  // Cargar llamados
  useEffect(() => {
    cargarLlamados()

    const intervalo = setInterval(async () => {
      await verificarNuevosLlamados()
      await cargarLlamados()
    }, 3000)

    return () => clearInterval(intervalo)
  }, [])

  const cargarLlamados = async () => {
    try {
      const data = await displayAPI.obtenerLlamadosRecientes(5)
      setLlamados(data)
    } catch (error) {
      console.error('Error cargando llamados:', error)
    }
  }

  const verificarNuevosLlamados = async () => {
    try {
      const data = await displayAPI.obtenerNuevosLlamados()
      
      if (data.hay_llamados && data.llamados.length > 0) {
        console.log('📢 Nuevos llamados detectados:', data.llamados.length)
        
        // AGREGAR los nuevos llamados a los activos (no reemplazar)
        setLlamadosActivos((prevLlamados) => {
          // Combinar llamados previos con nuevos, evitando duplicados
          const nuevosIds = data.llamados.map((l: Llamado) => l.numero_turno)
          const filtrados = prevLlamados.filter(l => !nuevosIds.includes(l.numero_turno))
          return [...filtrados, ...data.llamados]
        })
        
        // Agregar a cola de anuncios
        data.llamados.forEach((llamado: Llamado) => {
          if (llamado.texto_anuncio) {
            console.log('➕ Agregando a cola:', llamado.texto_anuncio)
            colaAnunciosRef.current.push(llamado.texto_anuncio)
          }
        })
        
        // Calcular duración estimada del anuncio completo
        const duracionEstimada = calcularDuracionAnuncio(data.llamados)
        console.log(`⏱️ Duración estimada del anuncio: ${duracionEstimada}ms`)
        
        // Procesar cola (no bloqueante)
        procesarColaAnuncios()
        
        // Ocultar cada llamado individual después de que termine su anuncio completo
        let tiempoAcumulado = 0
        
        data.llamados.forEach((llamado: Llamado, index: number) => {
          // Calcular duración de este anuncio específico
          const palabras = llamado.texto_anuncio?.split(' ').length || 10
          const duracionSonido = 1200        // Sonido DING-DING-DING-DONG
          const duracionVoz = palabras * 500 // Voz del anuncio (aumentado a 500ms por palabra)
          const pausaDespues = 1500          // Pausa extra después del anuncio (aumentado)
          const duracionIndividual = duracionSonido + duracionVoz + pausaDespues
          
          // Tiempo acumulado desde el inicio (todos los anuncios anteriores + este)
          tiempoAcumulado += duracionIndividual
          
          // Agregar 5 segundos más de margen para que se vea bien (aumentado)
          const tiempoOcultar = tiempoAcumulado + 5000
          
          console.log(`⏱️ Llamado ${index + 1} (${llamado.numero_turno}): visible por ${(tiempoOcultar/1000).toFixed(1)}s`)
          
          setTimeout(() => {
            setLlamadosActivos((prev) => prev.filter(l => l.numero_turno !== llamado.numero_turno))
            console.log(`👋 Ocultando llamado: ${llamado.numero_turno}`)
          }, tiempoOcultar)
        })
      }
    } catch (error) {
      console.error('Error verificando nuevos llamados:', error)
    }
  }

  const calcularDuracionAnuncio = (llamados: Llamado[]): number => {
    // Calcular duración aproximada basada en el texto
    let duracionTotal = 0
    
    llamados.forEach((llamado) => {
      if (llamado.texto_anuncio) {
        // Duración del sonido de atención: ~1.2 segundos
        duracionTotal += 1200
        
        // Estimar duración del texto (promedio 150 palabras por minuto = 400ms por palabra)
        const palabras = llamado.texto_anuncio.split(' ').length
        const duracionTexto = palabras * 400
        
        duracionTotal += duracionTexto
        
        // Pausa entre anuncios: 800ms
        duracionTotal += 800
      }
    })
    
    // Agregar 2 segundos de margen de seguridad
    return duracionTotal + 2000
  }

  const procesarColaAnuncios = async () => {
    if (anunciandoRef.current) {
      console.log('⏭️ Ya hay anuncios en proceso')
      return
    }
    
    console.log('🎙️ Iniciando cola de anuncios. Total:', colaAnunciosRef.current.length)
    anunciandoRef.current = true
    
    while (colaAnunciosRef.current.length > 0) {
      const texto = colaAnunciosRef.current.shift()
      if (texto) {
        // Reproducir sonido de atención ANTES del anuncio
        await reproducirSonidoAtencion()
        
        console.log('🔊 Anunciando:', texto)
        await anunciarLlamado(texto)
      }
    }
    
    console.log('✅ Cola de anuncios completada')
    anunciandoRef.current = false
  }

  const reproducirSonidoAtencion = (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Crear tonos con efecto de "campana" más llamativo
        const reproducirTono = (frecuencia: number, duracion: number, volumen: number, retraso: number) => {
          return new Promise<void>((res) => {
            setTimeout(() => {
              const oscilador = audioContext.createOscillator()
              const ganancia = audioContext.createGain()
              
              oscilador.connect(ganancia)
              ganancia.connect(audioContext.destination)
              
              oscilador.frequency.value = frecuencia
              oscilador.type = 'sine'  // Tono puro tipo campana
              
              // Envelope para simular una campana
              ganancia.gain.setValueAtTime(volumen, audioContext.currentTime)
              ganancia.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duracion)
              
              oscilador.start(audioContext.currentTime)
              oscilador.stop(audioContext.currentTime + duracion)
              
              setTimeout(() => res(), duracion * 1000 + 50)
            }, retraso)
          })
        }
        
        // Reproducir secuencia "DING-DING-DONG" más llamativa
        // Tres tonos ascendentes y uno descendente
        Promise.resolve()
          .then(() => reproducirTono(880, 0.15, 0.5, 0))      // Primer DING (LA alto)
          .then(() => reproducirTono(1047, 0.15, 0.6, 80))    // Segundo DING (DO más alto) - MÁS FUERTE
          .then(() => reproducirTono(1319, 0.25, 0.7, 80))    // Tercer DING (MI muy alto) - AÚN MÁS FUERTE Y LARGO
          .then(() => reproducirTono(659, 0.35, 0.5, 100))    // DONG final (MI grave, largo)
          .then(() => {
            console.log('🔔 Sonido de atención reproducido (LLAMATIVO)')
            setTimeout(() => resolve(), 300) // Pausa después del sonido
          })
      } catch (error) {
        console.warn('No se pudo reproducir sonido de atención:', error)
        resolve()
      }
    })
  }

  const anunciarLlamado = (texto: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.error('❌ speechSynthesis NO disponible')
        resolve()
        return
      }

      console.log('🎤 Estado de voz:', vozActivada ? 'ACTIVADA' : 'DESACTIVADA')

      // Cancelar anuncios previos
      window.speechSynthesis.cancel()
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(texto)
        
        // Seleccionar voz en español
        const voces = window.speechSynthesis.getVoices()
        const vozEspanol = voces.find(v => v.lang.startsWith('es-'))
        
        if (vozEspanol) {
          utterance.voice = vozEspanol
          console.log('🗣️ Usando voz:', vozEspanol.name)
        }
        
        utterance.lang = 'es-ES'
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1
        
        let finalizado = false
        
        const timeout = setTimeout(() => {
          if (!finalizado) {
            console.warn('⏱️ Timeout - Cancelando anuncio')
            window.speechSynthesis.cancel()
            finalizado = true
            resolve()
          }
        }, 15000)
        
        utterance.onstart = () => {
          console.log('▶️ ANUNCIO INICIADO')
        }
        
        utterance.onend = () => {
          console.log('✅ ANUNCIO COMPLETADO')
          if (!finalizado) {
            finalizado = true
            clearTimeout(timeout)
            setTimeout(() => resolve(), 800)
          }
        }
        
        utterance.onerror = (event) => {
          console.error('❌ ERROR en anuncio:', event.error, event)
          if (!finalizado) {
            finalizado = true
            clearTimeout(timeout)
            window.speechSynthesis.cancel()
            resolve()
          }
        }
        
        try {
          console.log('🚀 Ejecutando speak()...')
          window.speechSynthesis.speak(utterance)
          
          // Verificar si empezó a hablar
          setTimeout(() => {
            if (!window.speechSynthesis.speaking && !finalizado) {
              console.warn('⚠️ No está hablando, reintentando...')
              window.speechSynthesis.cancel()
              window.speechSynthesis.speak(utterance)
            }
          }, 300)
        } catch (error) {
          console.error('💥 Excepción al ejecutar speak:', error)
          finalizado = true
          clearTimeout(timeout)
          resolve()
        }
      }, 150)
    })
  }

  const activarVozManual = () => {
    console.log('👆 Activación manual de voz')
    if ('speechSynthesis' in window) {
      const test = new SpeechSynthesisUtterance('Sistema activado')
      test.volume = 0.5
      test.lang = 'es-ES'
      window.speechSynthesis.speak(test)
      setVozActivada(true)
      console.log('✅ Voz activada manualmente')
    }
  }

  const formatearHora = (fecha: Date) => {
    return fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-hospital-dark via-gray-900 to-hospital-dark text-white flex flex-col">
      {/* Botón de activación visible */}
      {!vozActivada && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <button
            onClick={activarVozManual}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-2xl px-12 py-6 rounded-2xl shadow-2xl animate-pulse"
          >
            🔊 CLICK AQUÍ PARA ACTIVAR VOZ
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-hospital-blue shadow-2xl flex-shrink-0">
        <div className="container mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo con fondo blanco destacado */}
            <div className="bg-white rounded-xl p-2 shadow-lg">
              <img src="/logo.png" alt="Hospital Logo" className="h-14 w-auto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Sistema de Turnos</h1>
              <p className="text-lg opacity-90">Hospital Divino Salvador de Sopó</p>
            </div>
          </div>
          
          <button
            onClick={activarVozManual}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              vozActivada
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-black animate-pulse'
            }`}
          >
            {vozActivada ? '🔊 VOZ ACTIVA' : '🔇 ACTIVAR VOZ'}
          </button>
          
          <div className="text-right">
            <div className="text-4xl font-bold">{formatearHora(horaActual)}</div>
            <div className="text-sm opacity-90 capitalize">{formatearFecha(horaActual)}</div>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Llamados activos */}
      {llamadosActivos.length > 0 && (
        <div className="bg-gradient-to-r from-hospital-green to-green-600 animate-pulse flex-shrink-0">
          <div className="container mx-auto px-8 py-6">
            <p className="text-2xl mb-4 font-semibold text-center">AHORA LLAMANDO</p>
            <div className={`grid gap-4 ${
              llamadosActivos.length === 1 ? 'grid-cols-1' :
              llamadosActivos.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {llamadosActivos.map((llamado, index) => {
                const esConsultorio = llamado.servicio === 'Consulta Médica'
                return (
                  <div key={index} className="bg-white text-hospital-dark rounded-2xl p-5 shadow-2xl">
                    <p className="text-lg mb-2 text-gray-600 text-center">Turno</p>
                    <p className={`font-bold mb-2 text-center ${
                      llamadosActivos.length === 1 ? 'text-7xl' :
                      llamadosActivos.length === 2 ? 'text-5xl' :
                      'text-4xl'
                    }`}>
                      {llamado.numero_turno}
                    </p>
                    <p className={`font-semibold mb-3 text-center ${
                      llamadosActivos.length === 1 ? 'text-2xl' :
                      llamadosActivos.length === 2 ? 'text-xl' :
                      'text-lg'
                    }`}>
                      {llamado.nombre_paciente}
                    </p>
                    <div className="text-center">
                      {!esConsultorio && (
                        <p className="text-sm text-gray-600 mb-1">{llamado.servicio}</p>
                      )}
                      <div className="bg-hospital-green rounded-lg p-3 inline-block min-w-[100px]">
                        <p className="text-xs opacity-75 text-white">
                          {esConsultorio ? 'Consultorio' : 'Ventanilla'}
                        </p>
                        <p className={`font-bold text-white ${
                          llamadosActivos.length === 1 ? 'text-4xl' :
                          llamadosActivos.length === 2 ? 'text-3xl' :
                          'text-2xl'
                        }`}>
                          {llamado.ventanilla}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lista de llamados recientes */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="container mx-auto px-8 py-4 flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-center">Últimos Llamados</h2>
          
          {llamados.length === 0 ? (
            <div className="text-center text-xl text-gray-400 flex-1 flex items-center justify-center">
              No hay llamados recientes
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 overflow-hidden">
              {llamados.map((llamado, index) => {
                const esConsultorio = llamado.servicio === 'Consulta Médica'
                return (
                  <div
                    key={llamado.id}
                    className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all ${
                      index === 0 ? 'border-2 border-hospital-green' : 'border border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="bg-hospital-blue rounded-lg p-3 min-w-[120px] text-center">
                          <p className="text-xs opacity-75">Turno</p>
                          <p className="text-2xl font-bold">{llamado.numero_turno}</p>
                        </div>
                        <div>
                          <p className="text-xl font-semibold mb-1">
                            {llamado.nombre_paciente}
                          </p>
                          {!esConsultorio && (
                            <p className="text-sm text-gray-300">{llamado.servicio}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Diríjase a</p>
                        <div className="bg-hospital-green rounded-lg p-3 min-w-[100px]">
                          <p className="text-xs opacity-75">
                            {esConsultorio ? 'Consultorio' : 'Ventanilla'}
                          </p>
                          <p className="text-3xl font-bold">{llamado.ventanilla}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-hospital-blue/20 backdrop-blur-sm py-3 flex-shrink-0">
        <div className="container mx-auto px-8 text-center">
          <div className="flex justify-between items-center">
            <p className="text-base opacity-75">
              Por favor permanezca atento al llamado de su turno
            </p>
            <div className={`text-sm px-4 py-2 rounded-lg font-semibold ${
              vozActivada 
                ? 'bg-green-500/30 text-green-200' 
                : 'bg-yellow-500/30 text-yellow-200 animate-pulse'
            }`}>
              {vozActivada ? '✅ Sistema de voz ACTIVO' : '⚠️ Click en ACTIVAR VOZ'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DisplayScreen

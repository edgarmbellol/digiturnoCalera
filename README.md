# Digiturno Calera

Sistema de gestión de turnos para el Hospital de La Calera.

## Características

- Gestión de turnos para diferentes servicios:
  - Citas Médicas
  - Facturación
  - Famisanar
  - Sanitas
- Panel profesional con actualización en tiempo real
- Sistema de login para profesionales
- Interfaz moderna y responsiva
- Comunicación en tiempo real mediante WebSockets

## Requisitos

- Python 3.8 o superior
- SQL Server
- Navegador web moderno

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/edgarmbellol/digiturnoCalera.git
cd digiturnoCalera
```

2. Crear y activar entorno virtual:
```bash
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
SQL_SERVER=tu_servidor
SQL_DATABASE=tu_base_de_datos
SQL_USERNAME=tu_usuario
SQL_PASSWORD=tu_contraseña
```

5. Ejecutar la aplicación:
```bash
python app.py
```

## Estructura del Proyecto

```
digiturnoCalera/
├── app.py                 # Aplicación principal
├── config/               # Configuraciones
│   ├── config.py        # Configuración general
│   └── config_app.py    # Configuración de la aplicación
├── database/            # Módulos de base de datos
│   ├── db.py           # Funciones de base de datos principal
│   └── database_app.py # Funciones de base de datos de la aplicación
├── static/             # Archivos estáticos
│   ├── css/           # Estilos CSS
│   └── js/            # Scripts JavaScript
└── templates/         # Plantillas HTML
    ├── index.html    # Página principal
    ├── login.html    # Página de login
    ├── profesional.html # Panel profesional
    └── espera.html   # Página de espera
```

## Uso

1. Acceder a la aplicación en `http://localhost:5000`
2. Los pacientes pueden tomar turnos desde la página principal
3. Los profesionales pueden acceder al panel profesional mediante login
4. El panel profesional muestra los turnos en tiempo real
5. Los profesionales pueden llamar turnos desde el panel

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 
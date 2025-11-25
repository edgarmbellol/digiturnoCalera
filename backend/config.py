"""Configuración del sistema"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # SQL Server - Solo lectura
    SQL_SERVER: str = "192.168.1.26"
    SQL_DATABASE: str = "CITISALUD"
    SQL_USERNAME: str = "con"
    SQL_PASSWORD: str = "Sopo2023*"
    SQL_DRIVER: str = "SQL Server"  # Driver genérico de Windows
    
    # SQLite Local
    SQLITE_DB_PATH: str = "../digiturno.db"
    
    # Google Gemini AI
    GEMINI_API_KEY: str = "AIzaSyAyIyYauiciiyuE5RaPtZX5yfKxf1-21DE"
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"  # Gemini 2.5 Flash-Lite
    
    # Configuración de turnos
    SERVICES: list = [
        "Citas Médicas",      # Para asignación de citas (ventanilla)
        "Facturación",
        "Famisanar",
        "Nueva EPS"
    ]
    
    # Nota: "Consulta Médica" es usado internamente por los médicos
    
    WINDOWS: dict = {
        "Citas Médicas": 2,
        "Facturación": 3,
        "Famisanar": 1,
        "Nueva EPS": 1
    }
    
    SPECIAL_CONDITIONS: list = [
        "Ninguna",
        "Discapacitado",
        "Tercera Edad",
        "Embarazo"
    ]
    
    class Config:
        env_file = ".env"


settings = Settings()


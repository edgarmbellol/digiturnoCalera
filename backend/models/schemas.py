"""Esquemas Pydantic para validación de datos"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Schemas para Kiosco
class KioskInput(BaseModel):
    documento: str = Field(..., min_length=5, max_length=20)
    servicio: str
    condicion_especial: Optional[str] = "Ninguna"


class TurnoResponse(BaseModel):
    id: int
    numero_turno: str
    documento: str
    nombre_paciente: str
    servicio: str
    condicion_especial: Optional[str]
    estado: str
    fecha_registro: str


# Schemas para Profesionales
class LoginRequest(BaseModel):
    codigo_usuario: str
    clave: str
    servicio: str
    ventanilla: int


class LoginResponse(BaseModel):
    success: bool
    message: str
    sesion_id: Optional[int] = None
    codigo_usuario: Optional[str] = None
    nombre_usuario: Optional[str] = None
    servicio: Optional[str] = None
    ventanilla: Optional[int] = None


class LlamarPacienteRequest(BaseModel):
    turno_id: int
    ventanilla: int
    codigo_profesional: str


class AtenderPacienteRequest(BaseModel):
    turno_id: int
    estado: str  # "atendido" o "no_responde"
    observacion: Optional[str] = None


# Schemas para Médicos
class CitaResponse(BaseModel):
    secuencia: int
    fecha: str
    hora: str
    profesional: str
    documento: str
    nombre_paciente: str
    indicador: Optional[int]
    estado_cita: str
    en_espera: bool = False
    facturado: bool = False
    estado_turno: Optional[str] = None


class MarcarFacturadoRequest(BaseModel):
    secuencia_cita: int
    documento: str


# Schemas para Pantalla de Espera
class LlamadoDisplay(BaseModel):
    id: int
    numero_turno: str
    nombre_paciente: str
    servicio: str
    ventanilla: int
    fecha_llamado: str


class PacienteEnEspera(BaseModel):
    id: int
    numero_turno: str
    nombre_paciente: str
    servicio: str
    condicion_especial: Optional[str]
    tiempo_espera: str
    estado: Optional[str] = "espera"


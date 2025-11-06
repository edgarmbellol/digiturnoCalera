"""
Sistema de Digiturno - Hospital Divino Salvador de Sopó
Backend FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database.sqlite_db import init_db
from routers import kiosk_routes, professional_routes, doctor_routes, display_routes, admin_routes, ai_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    # Startup
    init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Sistema de Digiturno",
    description="Sistema de gestión de turnos para Hospital Divino Salvador de Sopó",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(kiosk_routes.router, prefix="/api/kiosk", tags=["Kiosk"])
app.include_router(professional_routes.router, prefix="/api/professional", tags=["Professional"])
app.include_router(doctor_routes.router, prefix="/api/doctor", tags=["Doctor"])
app.include_router(display_routes.router, prefix="/api/display", tags=["Display"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["AI"])


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "Sistema de Digiturno - Hospital Divino Salvador de Sopó",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    """Verificación de salud del servicio"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


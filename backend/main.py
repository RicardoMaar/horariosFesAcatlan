from fastapi import FastAPI, HTTPException, Request, Depends
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import json
import os
import uvicorn
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import httpx

HORARIOS_JSON_URL = os.getenv("HORARIOS_JSON_URL")

cache = {
    "data": None,
    "last_modified": None, # Usaremos esto para la validación
    "carreras_summary": None,
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Iniciar cliente HTTP al arrancar la app
    app.state.http_client = httpx.AsyncClient()
    # Verificar que la URL esté configurada
    if not HORARIOS_JSON_URL:
        raise RuntimeError("La variable de entorno HORARIOS_JSON_URL no está definida.")
    yield
    # Cerrar cliente HTTP al apagar la app
    await app.state.http_client.aclose()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="FES Acatlán Horarios API",
    description="API para consultar horarios académicos de la FES Acatlán",
    version="2.1.0",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)




# Middleware para CORS
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],  # Permitir todos los orígenes para desarrollo
    allow_origins=["https://checatuhorario.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Middleware para comprimir respuestas
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Cache en memoria
data_cache = None
last_update = None
carreras_cache = None

# --- LÓGICA DE DATOS ---
async def load_data(client: httpx.AsyncClient):
    """
    Carga y cachea los datos desde la URL externa, validando con el header 'Last-Modified'.
    """
    try:
        # Hacemos una petición HEAD para ser eficientes. Solo queremos las cabeceras.
        head_response = await client.head(HORARIOS_JSON_URL)
        head_response.raise_for_status() # Lanza error si la petición falla (ej. 404)
        
        last_modified_header = head_response.headers.get("Last-Modified")

        # Si el header no ha cambiado y tenemos data en caché, la retornamos.
        if cache["data"] and cache["last_modified"] == last_modified_header:
            return cache["data"]

        # Si el caché está obsoleto o vacío, descargamos el JSON completo.
        response = await client.get(HORARIOS_JSON_URL)
        response.raise_for_status()
        
        # Actualizamos el caché
        cache["data"] = response.json()
        cache["last_modified"] = last_modified_header
        cache["carreras_summary"] = None # Invalidamos el caché de resumen de carreras
        
        print(f"✅ Datos cargados y cacheados. Última modificación: {last_modified_header}")
        return cache["data"]

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"No se pudo contactar al servicio de datos: {e}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error al decodificar el JSON de horarios.")

# --- ENDPOINTS ---

@limiter.limit("100/minute")
@app.get("/api/status")
async def get_status(request: Request):
    """
    Endpoint LIGERO para el frontend.
    Devuelve la fecha de última actualización obtenida del header 'Last-Modified' del JSON.
    Esta es la implementación que tu frontend necesita para validar su caché.
    """
    try:
        # Usa el cliente HTTP del estado de la app
        client = request.app.state.http_client
        head_response = await client.head(HORARIOS_JSON_URL)
        head_response.raise_for_status()
        
        # La fecha que el frontend usará para validar
        fecha_actualizacion = head_response.headers.get("Last-Modified")
        
        return {
            "status": "ok",
            # Usamos el header estándar como la fuente de verdad.
            "fecha_actualizacion": fecha_actualizacion
        }
    except httpx.RequestError:
        raise HTTPException(503, "El servicio de datos no está disponible.")
    except Exception as e:
        raise HTTPException(500, str(e))

@limiter.limit("100/minute")
@app.get("/api/carreras")
async def get_carreras(request: Request):
    """Lista todas las carreras. Usa el caché de resumen si está disponible."""
    try:
        if cache["carreras_summary"]:
            return cache["carreras_summary"]

        client = request.app.state.http_client
        data = await load_data(client) # Carga la data completa si es necesario
        carreras = {}
        
        for codigo, carrera_data in data.get("carreras", {}).items():
            carreras[codigo] = {
                "codigo": codigo,
                "nombre": carrera_data.get("nombre", "Sin nombre"),
            }
        
        cache["carreras_summary"] = carreras # Guarda el resumen en caché
        return carreras
    
    except Exception as e:
        raise HTTPException(500, f"Error cargando carreras: {str(e)}")


@limiter.limit("100/minute")
@app.get("/api/horarios/{carrera_codigo}")
async def get_horarios_carrera(carrera_codigo: str, request: Request):
    """Obtiene los horarios de una carrera, usando ETags para el caché del navegador."""
    try:
        client = request.app.state.http_client
        data = await load_data(client)

        # El ETag ahora se basa en el header 'Last-Modified' del archivo fuente
        current_etag = f'"{carrera_codigo}-{cache["last_modified"]}"'
        
        if request.headers.get("if-none-match") == current_etag:
            return JSONResponse(content="", status_code=304)

        carreras = data.get("carreras", {})
        if carrera_codigo not in carreras:
            raise HTTPException(404, f"Carrera {carrera_codigo} no encontrada")
        
        response_data = carreras[carrera_codigo]
        
        headers = {
            "Cache-Control": "public, max-age=86400", # Cache en navegador por 1 día
            "ETag": current_etag
        }
        
        return JSONResponse(content=response_data, headers=headers)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error cargando horarios: {str(e)}")

# ... (El endpoint raíz "/" y el de health "/api/health" pueden quedar como están)
# ... (El bloque if __name__ == "__main__": también puede quedar igual)
@limiter.limit("100/minute")
@app.get("/")
async def root(request: Request):
    """Endpoint raíz con información de la API"""
    return {
        "message": "FES Acatlán Horarios API",
        "version": "2.1.0",
        "endpoints": {
            "/api/status": "Estado del servicio y datos disponibles",
            "/api/carreras": "Lista de todas las carreras",
            "/api/horarios/{carrera_codigo}": "Horarios de una carrera específica",
        }
    }

@limiter.limit("100/minute")
@app.get("/api/health")
async def health_check(request: Request):
    """Endpoint para verificar que el servicio está activo"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
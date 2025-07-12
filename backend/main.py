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
from datetime import datetime
from unidecode import unidecode

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="FES Acatlán Horarios API",
    description="API para consultar horarios académicos de la FES Acatlán",
    version="2.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)




# Middleware para CORS
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],  # Permitir todos los orígenes para desarrollo
    allow_origins=["https://checatuhorario.com"],
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

def load_data():
    """Carga datos del JSON generado por el scraper"""
    global data_cache, last_update
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    possible_paths = [
        # Para producción - archivo en carpeta materias al mismo nivel que main.py
        os.path.join(script_dir, "materias", "todas_carreras.json"),
        # Para desarrollo - mantener rutas existentes como fallback
        os.path.join(script_dir, "..", "scraper", "materias", "todas_carreras.json"),
        os.path.join(script_dir, "scraper", "materias", "todas_carreras.json"),
        os.path.join(os.getcwd(), "scraper", "materias", "todas_carreras.json"),
        # Para desarrollo local
        os.path.join(script_dir, "todas_carreras.json")
]
    
    json_path = None
    for path in possible_paths:
        if os.path.exists(path):
            json_path = path
            break
    
    if not json_path:
        raise HTTPException(500, "Archivo de datos no encontrado")
    
    file_mod_time = os.path.getmtime(json_path)
    if data_cache is None or last_update != file_mod_time:
        with open(json_path, 'r', encoding='utf-8') as f:
            data_cache = json.load(f)
        last_update = file_mod_time
        # Limpiar cache de carreras cuando se actualizan datos
        global carreras_cache
        carreras_cache = None
    
    return data_cache

@limiter.limit("100/minute")
@app.get("/")
async def root(request: Request):
    """Endpoint raíz con información de la API"""
    return {
        "message": "FES Acatlán Horarios API",
        "version": "2.0.0",
        "endpoints": {
            "/api/status": "Estado del servicio y datos disponibles",
            "/api/carreras": "Lista de todas las carreras",
            "/api/horarios/{carrera_codigo}": "Horarios de una carrera específica",
            "/api/buscar": "Búsqueda de materias o profesores"
        }
    }
@limiter.limit("100/minute")
@app.get("/api/status")
async def get_status(request: Request):
    """Obtiene el estado del servicio y estadísticas de datos"""
    try:
        data = load_data()
        
        carreras_data = data.get("carreras", {})
        
        total_materias = 0
        total_grupos = 0
        
        for carrera in carreras_data.values():
            materias = carrera.get("materias", {})
            total_materias += len(materias)
            for materia in materias.values():
                total_grupos += len(materia.get("grupos", []))
        
        return {
            "status": "ok",
            "ultima_actualizacion": data.get("fecha_actualizacion", "No disponible"),
            "estadisticas": {
                "total_carreras": len(carreras_data),
                "total_materias": total_materias,
                "total_grupos": total_grupos
            },
            "cache_headers": {
                "Cache-Control": "public, max-age=3600"
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )
    
@limiter.limit("100/minute")
@app.get("/api/carreras")
async def get_carreras(request: Request):
    """Lista todas las carreras disponibles con metadatos básicos"""
    global carreras_cache
    
    try:
        # Usar cache si está disponible
        if carreras_cache is not None:
            return carreras_cache
        
        data = load_data()
        carreras = {}
        
        
        for codigo, carrera_data in data.get("carreras", {}).items():
            # Contar semestres únicos
            semestres = set()
            for materia in carrera_data.get("materias", {}).values():
                semestre = materia.get("semestre", "")
                # if semestre and semestre != "40":  # 40 es para optativas
                semestres.add(semestre)
            
            carreras[codigo] = {
                "codigo": codigo,
                "nombre": carrera_data.get("nombre", "Sin nombre"),
                "total_materias": len(carrera_data.get("materias", {})),
                "semestres_regulares": len(semestres),
                "tiene_optativas": any(
                    m.get("semestre") == "40" 
                    for m in carrera_data.get("materias", {}).values()
                )
            }
        
        # Guardar en cache
        carreras_cache = carreras
        
        return carreras
    
    except Exception as e:
        raise HTTPException(500, f"Error cargando carreras: {str(e)}")

@limiter.limit("100/minute")
@app.get("/api/horarios/{carrera_codigo}")
async def get_horarios_carrera(carrera_codigo: str, request: Request):
    """
    Obtiene todos los horarios de una carrera específica.
    Incluye headers de cache para optimizar cliente.
    """
    try:
        data = load_data()
        current_etag = f'"{carrera_codigo}-{last_update}"'
        # Verificar If-None-Match header
        if_none_match = request.headers.get("if-none-match")
        if if_none_match == current_etag:
            return JSONResponse(content="", status_code=304)

        carreras = data.get("carreras", {})
        
        if carrera_codigo not in carreras:
            raise HTTPException(404, f"Carrera {carrera_codigo} no encontrada")
        
        response_data = carreras[carrera_codigo]
        
        # Agregar metadatos útiles
        response_data["metadata"] = {
            "codigo": carrera_codigo,
            "total_materias": len(response_data.get("materias", {})),
            "fecha_consulta": response_data.get("fecha_consulta", None)
        }
        
        headers = {
            "Cache-Control": "public, max-age=86400",
            "ETag": f'"{carrera_codigo}-{last_update}"'
        }
        
        return JSONResponse(content=response_data, headers=headers)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error cargando horarios: {str(e)}")


@limiter.limit("100/minute")
@app.get("/api/health")
async def health_check(request: Request):
    """Endpoint para verificar que el servicio está activo"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    # Configuración para desarrollo
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os
import uvicorn

app = FastAPI(
    title="FES Acatlán Horarios API",
    description="API para consultar horarios académicos de la FES Acatlán",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

data_cache = None
last_update = None

def load_data():
    """Carga datos del JSON generado por el scraper"""
    global data_cache, last_update
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    possible_paths = [
        os.path.join(script_dir, "..", "scraper", "materias", "todas_carreras.json"),
        os.path.join(script_dir, "scraper", "materias", "todas_carreras.json"),
        os.path.join(os.getcwd(), "scraper", "materias", "todas_carreras.json")
    ]
    
    json_path = None
    for path in possible_paths:
        if os.path.exists(path):
            json_path = path
            break
    
    if not json_path:
        raise HTTPException(500, f"JSON no encontrado")
    
    file_mod_time = os.path.getmtime(json_path)
    if data_cache is None or last_update != file_mod_time:
        with open(json_path, 'r', encoding='utf-8') as f:
            data_cache = json.load(f)
        last_update = file_mod_time
    
    return data_cache

@app.get("/")
async def root():
    return {"message": "FES Acatlán Horarios API", "version": "1.0.0"}

@app.get("/api/status")
async def get_status():
    try:
        data = load_data()
        carreras_data = data.get("carreras", {})
        
        return {
            "status": "ok",
            "total_carreras": len(carreras_data),
            "carreras_disponibles": {
                codigo: carrera.get("nombre", "Sin nombre") 
                for codigo, carrera in carreras_data.items()
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/api/carreras")
async def get_carreras():
    """Lista todas las carreras disponibles"""
    try:
        data = load_data()
        carreras = {}
        
        for codigo, carrera_data in data.get("carreras", {}).items():
            carreras[codigo] = {
                "codigo": codigo,
                "nombre": carrera_data.get("nombre", "Sin nombre"),
                "total_materias": len(carrera_data.get("materias", {}))
            }
        
        return carreras
    
    except Exception as e:
        raise HTTPException(500, f"Error cargando carreras: {str(e)}")

@app.get("/api/horarios/{carrera_codigo}")
async def get_horarios_carrera(carrera_codigo: str):
    """Obtiene horarios completos de una carrera - cliente maneja búsqueda y conflictos"""
    try:
        data = load_data()
        carreras = data.get("carreras", {})
        
        if carrera_codigo not in carreras:
            available = list(carreras.keys())
            raise HTTPException(
                404, 
                f"Carrera {carrera_codigo} no encontrada. Disponibles: {available}"
            )
        
        return carreras[carrera_codigo]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error cargando horarios: {str(e)}")



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
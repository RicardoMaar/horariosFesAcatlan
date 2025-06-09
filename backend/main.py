from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os
from datetime import datetime
from typing import List, Dict, Any
import uvicorn

app = FastAPI(
    title="FES Acatlán Horarios API",
    description="API para consultar horarios académicos de la FES Acatlán",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar por tu dominio en producción
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Cache en memoria
data_cache = None
last_update = None

def load_data():
    """Carga datos del JSON generado por el scraper"""
    global data_cache, last_update
    
    # Buscar el JSON en varias ubicaciones posibles
    possible_paths = [
        "../scraper/materias/todas_carreras.json"
    ]
    
    json_path = None
    for path in possible_paths:
        if os.path.exists(path):
            json_path = path
            break
    
    if not json_path:
        current_dir = os.getcwd()
        raise HTTPException(500, f"JSON no encontrado en: {current_dir}")
    
    # Verificar si necesita actualizar cache
    file_mod_time = os.path.getmtime(json_path)
    if data_cache is None or last_update != file_mod_time:
        with open(json_path, 'r', encoding='utf-8') as f:
            data_cache = json.load(f)
        last_update = file_mod_time
    
    return data_cache

@app.get("/")
async def root():
    """Endpoint de bienvenida"""
    return {"message": "FES Acatlán Horarios API", "version": "1.0.0"}

@app.get("/api/status")
async def get_status():
    """Estado de la API y última actualización"""
    try:
        data = load_data()
        return {
            "status": "ok",
            "total_carreras": data.get("total_carreras", 0),
            "fecha_actualizacion": data.get("fecha_actualizacion"),
            "carreras_disponibles": list(data.get("carreras", {}).keys())
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
        
        return {"carreras": carreras}
    
    except Exception as e:
        raise HTTPException(500, f"Error cargando carreras: {str(e)}")

@app.get("/api/horarios/{carrera_codigo}")
async def get_horarios_carrera(carrera_codigo: str):
    """Obtiene horarios de una carrera específica"""
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

@app.post("/api/horarios/multiple")
async def get_multiple_carreras(carreras_request: Dict[str, List[str]]):
    """Obtiene horarios de múltiples carreras"""
    try:
        carreras_codigos = carreras_request.get("carreras", [])
        
        if len(carreras_codigos) > 2:
            raise HTTPException(400, "Máximo 2 carreras permitidas")
        
        data = load_data()
        resultado = {}
        
        for codigo in carreras_codigos:
            if codigo not in data.get("carreras", {}):
                raise HTTPException(404, f"Carrera {codigo} no encontrada")
            
            resultado[codigo] = data["carreras"][codigo]
        
        return {"carreras": resultado}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error procesando solicitud: {str(e)}")

@app.get("/api/materias/{carrera_codigo}")
async def get_materias_carrera(carrera_codigo: str):
    """Obtiene solo las materias de una carrera (sin grupos)"""
    try:
        data = load_data()
        carreras = data.get("carreras", {})
        
        if carrera_codigo not in carreras:
            raise HTTPException(404, f"Carrera {carrera_codigo} no encontrada")
        
        carrera = carreras[carrera_codigo]
        materias_resumen = {}
        
        for clave, materia in carrera.get("materias", {}).items():
            materias_resumen[clave] = {
                "nombre": materia.get("nombre"),
                "semestre": materia.get("semestre"),
                "total_grupos": len(materia.get("grupos", []))
            }
        
        return {
            "carrera": carrera.get("nombre"),
            "codigo": carrera_codigo,
            "materias": materias_resumen
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error cargando materias: {str(e)}")

@app.get("/api/materia/{carrera_codigo}/{materia_clave}")
async def get_materia_detalle(carrera_codigo: str, materia_clave: str):
    """Obtiene detalle de una materia específica con todos sus grupos"""
    try:
        data = load_data()
        carreras = data.get("carreras", {})
        
        if carrera_codigo not in carreras:
            raise HTTPException(404, f"Carrera {carrera_codigo} no encontrada")
        
        materias = carreras[carrera_codigo].get("materias", {})
        
        if materia_clave not in materias:
            raise HTTPException(404, f"Materia {materia_clave} no encontrada")
        
        return {
            "carrera": carreras[carrera_codigo].get("nombre"),
            "clave": materia_clave,
            "materia": materias[materia_clave]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error cargando materia: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
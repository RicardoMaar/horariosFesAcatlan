import requests
from bs4 import BeautifulSoup
import json
import time
import re
from datetime import datetime
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FESAcatlanScraper:
    def __init__(self):
        self.base_url = "https://escolares.acatlan.unam.mx/HISTORIA/"
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Origin': 'https://escolares.acatlan.unam.mx',
            'Referer': 'https://escolares.acatlan.unam.mx/HISTORIA/MenuGrupoSIsaturacionORDInarioAlumno.ASP'
        }
        self.session.headers.update(self.headers)
        
        self.carreras = {"20321,Actuaría": "Actuaría"}
        
        self.dias_map = {
            'LU': 'Lunes', 'MA': 'Martes', 'MI': 'Miércoles',
            'JU': 'Jueves', 'VI': 'Viernes', 'SA': 'Sábado'
        }
    
    def parsear_horario(self, horario_str: str) -> List[Dict]:
        horarios = []
        bloques = horario_str.split(' y ')
        
        for bloque in bloques:
            bloque = bloque.strip()
            match = re.match(r'([A-Z,]+)\s+(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})', bloque)
            if match:
                dias_str = match.group(1)
                hora_inicio = match.group(2)
                hora_fin = match.group(3)
                
                dias = [d.strip() for d in dias_str.split(',')]
                
                for dia in dias:
                    if dia in self.dias_map:
                        horarios.append({
                            'dia': dia,
                            'dia_nombre': self.dias_map[dia],
                            'inicio': hora_inicio,
                            'fin': hora_fin
                        })
        
        return horarios
    
    def es_encabezado_grupo(self, fila) -> bool:
        """Detecta fila encabezado: th con SEMESTRE y GRUPO"""
        ths = fila.find_all('th')
        if len(ths) >= 2:
            texto = ' '.join([th.get_text() for th in ths])
            return 'SEMESTRE:' in texto and 'GRUPO:' in texto
        return False
    
    def extraer_grupo_semestre(self, fila) -> tuple:
        """Extrae semestre y grupo del encabezado"""
        ths = fila.find_all('th')
        semestre = None
        grupo = None
        
        for th in ths:
            texto = th.get_text()
            sem_match = re.search(r'SEMESTRE:\s*(\d+)', texto)
            grp_match = re.search(r'GRUPO:\s*(\d+)', texto)
            
            if sem_match:
                semestre = sem_match.group(1).zfill(2)
            if grp_match:
                grupo = grp_match.group(1)
        
        return semestre, grupo
    
    def es_fila_materia(self, fila) -> bool:
        """Detecta fila de materia: td despliegues con 4 dígitos + td justificado"""
        tds = fila.find_all('td')
        
        # Buscar td con class=despliegues que contenga 4 dígitos
        for td in tds:
            if td.get('class') and 'despliegues' in td.get('class'):
                texto = td.get_text(strip=True)
                if texto.isdigit() and len(texto) == 4:
                    return True
        return False
    
    def extraer_datos_materia(self, fila) -> Dict:
        """Extrae datos de materia de la fila"""
        tds = fila.find_all('td')
        
        # Buscar td con class=despliegues que contenga clave (4 dígitos)
        clave_td = None
        clave_pos = -1
        
        for i, td in enumerate(tds):
            if td.get('class') and 'despliegues' in td.get('class'):
                texto = td.get_text(strip=True)
                if texto.isdigit() and len(texto) == 4:
                    clave_td = td
                    clave_pos = i
                    break
        
        if not clave_td:
            return None
        
        try:
            clave = clave_td.get_text(strip=True)
            
            # Buscar td con class=justificado para nombre, horario, profesor
            justificados = [td for td in tds if td.get('class') and 'justificado' in td.get('class')]
            
            if len(justificados) < 3:
                return None
            
            nombre = justificados[0].get_text(strip=True)
            horario = justificados[1].get_text(strip=True)
            profesor = justificados[2].get_text(strip=True)
            
            # El último td suele ser el salón
            salon = ""
            for td in reversed(tds):
                texto = td.get_text(strip=True)
                if texto and not td.get('bgcolor'):  # No es espaciador gris
                    salon = texto
                    break
            
            return {
                'clave': clave,
                'nombre': nombre,
                'horario': horario,
                'profesor': profesor,
                'salon': salon
            }
        except Exception as e:
            logger.debug(f"Error extrayendo datos: {e}")
            return None
    
    def scrape_carrera(self, carrera_key: str) -> Dict:
        codigo = carrera_key.split(',')[0]
        nombre = self.carreras[carrera_key]
        
        logger.info(f"Scrapeando carrera: {nombre} ({codigo})")
        
        try:
            # Autenticación
            menu_url = self.base_url + "MenuGrupoSIsaturacionORDInarioAlumno.ASP"
            self.session.get(menu_url)
            time.sleep(1)
            
            post_url = self.base_url + "MenuGrupoSIsaturacionORDInarioAlumno1.asp"
            data = {
                'Carreras': carrera_key,
                'control1': 'UNO',
                'control2': 'tres'
            }
            self.session.post(post_url, data=data)
            time.sleep(1)
            
            result_url = self.base_url + "ProcesoGRUpoSISaturacionORDINArioAlumno.asp"
            resp = self.session.get(result_url)
            resp.encoding = 'utf-8'
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            tabla = soup.find('table', {'id': 'despimp'})
            
            if not tabla:
                logger.error(f"No se encontró tabla para {nombre}")
                return None
            
            # Procesar filas con contexto inmediato
            materias = {}
            filas = tabla.find_all('tr')
            
            i = 0
            while i < len(filas):
                fila = filas[i]
                
                if self.es_encabezado_grupo(fila):
                    semestre_actual, grupo_actual = self.extraer_grupo_semestre(fila)
                    logger.info(f"Procesando grupo: {grupo_actual}, semestre: {semestre_actual}")
                    
                    # Procesar todas las materias que siguen hasta el próximo encabezado
                    i += 1
                    while i < len(filas) and not self.es_encabezado_grupo(filas[i]):
                        fila_materia = filas[i]
                        
                        if self.es_fila_materia(fila_materia):
                            datos = self.extraer_datos_materia(fila_materia)
                            
                            if datos:
                                clave = datos['clave']
                                
                                if clave not in materias:
                                    materias[clave] = {
                                        'nombre': datos['nombre'],
                                        'semestre': semestre_actual,
                                        'grupos': []
                                    }
                                
                                materias[clave]['grupos'].append({
                                    'grupo': grupo_actual,
                                    'profesor': datos['profesor'],
                                    'horarios': self.parsear_horario(datos['horario']),
                                    'salon': datos['salon']
                                })
                                
                                logger.info(f"  {clave}: {datos['nombre']} -> {grupo_actual}")
                        i += 1
                else:
                    i += 1
            
            logger.info(f"Materias procesadas: {len(materias)}")
            
            return {
                'codigo': codigo,
                'nombre': nombre,
                'materias': materias,
                'ultima_actualizacion': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error scrapeando {nombre}: {str(e)}")
            return None
    
    def save_to_file(self, data: Dict, filename: str = 'horarios_fes_acatlan.json'):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Datos guardados en {filename}")

def main():
    scraper = FESAcatlanScraper()
    
    logger.info("Iniciando scraping...")
    result = scraper.scrape_carrera("20321,Actuaría")
    if result:
        scraper.save_to_file({'carreras': {result['codigo']: result}}, 'actuaria_final.json')
        print(f"Materias encontradas: {len(result['materias'])}")
        for clave, materia in result['materias'].items():
            print(f"  {clave}: {materia['nombre']} ({len(materia['grupos'])} grupos)")
    
    logger.info("Scraping completado")

if __name__ == "__main__":
    main()
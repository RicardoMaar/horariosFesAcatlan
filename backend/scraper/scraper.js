// FES Acatlán Scraper usando DOM directo
import fetch from 'node-fetch';
import path from 'path';
import { JSDOM } from 'jsdom';
import fs from 'fs';
const { DOMParser } = new JSDOM().window;

/**
 * Scraper para extraer horarios académicos del sistema FES Acatlán UNAM
 * Automatiza la consulta de materias, grupos y horarios de todas las carreras
 */
class FESAcatlanScraper {
    /**
     * Inicializa el scraper con mapeos de carreras y días
     */
    constructor() {
        // Mapeo de códigos de carrera con nombres amigables
        this.carreras = {
            "20321,Actuaría": "Actuaría",
            "20121,Arquitectura": "Arquitectura",
            "20422,Ciencias Políticas y Admon. Pública": "Ciencias Políticas",
            "20425,Comunicación": "Comunicación",
            "20721,Derecho": "Derecho",
            "20226,Diseño Gráfico": "Diseño Gráfico",
            "20821,Economía": "Economía",
            "24121,Enseñanza de Inglés": "Enseñanza de Inglés",
            "21011,Filosofía": "Filosofía",
            "21021,Historia": "Historia",
            "21121,Ingeniería Civil": "Ingeniería Civil",
            "21013,Lengua y Literatura Hispánicas": "Lengua y Literatura",
            "24022,Matemáticas. Apl. y Comp.": "Matemáticas Aplicadas",
            "21025,Pedagogía": "Pedagogía",
            "20424,Periodismo y Comunicación Colectiva": "Periodismo",
            "20421,Relaciones Internacionales": "Relaciones Internacionales",
            "20423,Sociología": "Sociología"
        };
        
        // Mapeo de abreviaciones de días a nombres completos
        this.diasMap = {
            'LU': 'Lunes',
            'MA': 'Martes', 
            'MI': 'Miércoles',
            'JU': 'Jueves',
            'VI': 'Viernes',
            'SA': 'Sábado'
        };
    }

    /**
     * Extrae horarios de una carrera específica mediante proceso HTTP de 3 pasos
     * @param {string} carreraKey - Código de carrera formato "código,nombre"
     * @returns {Object|null} Datos de la carrera con materias y horarios o null si falla
     */
    async scrapeCarrera(carreraKey) {
        const baseUrl = "https://escolares.acatlan.unam.mx/HISTORIA/";
        let cookies = '';
        
        try {
            console.log('1. Haciendo GET inicial...');
            
            // Paso 1: GET Menu (establecer cookies de sesión)
            const menuResponse = await fetch(baseUrl + "MenuGrupoSIsaturacionORDInarioAlumno.ASP", {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!menuResponse.ok) {
                throw new Error(`GET failed: ${menuResponse.status}`);
            }
            
            // Extraer cookies de la respuesta
            const setCookieHeaders = menuResponse.headers.raw()['set-cookie'];
            
            if (setCookieHeaders) {
                cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
            }
            console.log('2. Cookies extraídas:', cookies.substring(0, 100) + '...');
            
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('3. Haciendo POST...');
            
            // Paso 2: POST Datos de carrera seleccionada
            const formData = new URLSearchParams();
            formData.append('Carreras', carreraKey);
            formData.append('control1', 'UNO');
            formData.append('control2', 'tres');
            
            const postResponse = await fetch(baseUrl + "MenuGrupoSIsaturacionORDInarioAlumno1.asp", {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookies,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': baseUrl + "MenuGrupoSIsaturacionORDInarioAlumno.ASP"
                }
            });
            
            if (!postResponse.ok) {
                throw new Error(`POST failed: ${postResponse.status}`);
            }
            
            // Actualizar cookies si hay nuevas en la respuesta
            const newCookies = postResponse.headers.raw()['set-cookie'];
            if (newCookies) {
                const additionalCookies = newCookies.map(cookie => cookie.split(';')[0]).join('; ');
                cookies = cookies + '; ' + additionalCookies;
            }
            
            console.log('4. POST exitoso, esperando...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('5. Haciendo GET final...');
            
            // Paso 3: GET Página con resultados de horarios
            const resultResponse = await fetch(baseUrl + "ProcesoGRUpoSISaturacionORDINArioAlumno.asp", {
                headers: {
                    'Cookie': cookies,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': baseUrl + "MenuGrupoSIsaturacionORDInarioAlumno1.asp"
                }
            });
            
            console.log('6. Respuesta final:', resultResponse.status);
            
            if (!resultResponse.ok) {
                const errorText = await resultResponse.text();
                console.log('Error response:', errorText.substring(0, 500));
                throw new Error(`Final GET failed: ${resultResponse.status}`);
            }
            
            const html = await resultResponse.text();
            console.log('7. HTML obtenido, tamaño:', html.length);
            
            // Verificar si el HTML contiene datos de horarios
            console.log('8. Analizando contenido...');
            if (html.includes('<table') || html.includes('GRUPO') || html.includes('SEMESTRE')) {
                console.log('✅ Contenido de horarios detectado');
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                return this.extraerHorarios(doc, carreraKey);
            } else {
                console.log('❌ No se encontró contenido de horarios');
                return null;
            }
            
        } catch (error) {
            console.error('Error en scraping:', error);
            return null;
        }
    }

    /**
     * Extrae y procesa horarios del DOM HTML obtenido
     * @param {Document} doc - Documento DOM parseado
     * @param {string} carreraKey - Código de carrera
     * @returns {Object|null} Estructura de datos con materias organizadas o null si falla
     */
    extraerHorarios(doc, carreraKey) {
        // Buscar tabla principal por diferentes selectores posibles
        let tabla = doc.querySelector('table#despimp') || 
                   doc.querySelector('table') ||
                   doc.querySelector('[id*="table"]');
        
        if (!tabla) {
            console.error('Tabla no encontrada en DOM');
            return null;
        }

        const filas = Array.from(tabla.querySelectorAll('tr'));
        let currentGrupo = null;
        let currentSemestre = null;
        const materiasData = {};
        let materiasCount = 0;
        
        console.log(`Procesando ${filas.length} filas`);
        
        // Procesar cada fila de la tabla
        filas.forEach((fila, index) => {
            const textoFila = fila.textContent.trim();
            
            // Detectar fila de encabezado de grupo/semestre
            if (/^\d+\s+SEMESTRE:/.test(textoFila)) {
                currentSemestre = this.extraerSemestre(textoFila);
                currentGrupo = this.extraerGrupo(textoFila);
                console.log(`GRUPO: ${currentGrupo}, SEMESTRE: ${currentSemestre}`);
                return;
            }
            
            // Procesar fila de materia si tenemos contexto de grupo
            if (currentGrupo && this.esFilaMateria(fila)) {
                const materia = this.extraerMateriaDeDOM(fila, currentGrupo, currentSemestre);
                if (materia) {
                    this.agregarMateriaAEstructura(materiasData, materia);
                    materiasCount++;
                    console.log(`✅ Materia ${materiasCount}: ${materia.clave} - ${materia.nombre.substring(0, 30)}...`);
                }
            }
        });
        
        const [codigo, nombre] = carreraKey.split(',', 2);
    
        // Crear estructura final de datos
        const resultado = {
            codigo,
            nombre,
            fecha_consulta: new Date().toISOString(),
            materias: materiasData
        }; 
        
        // Guardar archivo JSON individual de la carrera
        // const materiasDir = path.join(process.cwd(), 'materias');
        // const fileName = path.join(materiasDir, `horarios_${nombre.toLowerCase().replace(/\s+/g, '_')}.json`);
        // fs.writeFileSync(fileName, JSON.stringify(resultado, null, 2), 'utf8');
        
        const totalMaterias = Object.keys(materiasData).length;
        const totalGrupos = Object.values(materiasData).reduce((sum, m) => sum + m.grupos.length, 0);
        
        console.log(`\n✅ EXTRACCIÓN EXITOSA`);
        console.log(`📊 ${nombre}: ${totalMaterias} materias, ${totalGrupos} grupos`);
        // console.log(`📄 Guardado en: ${fileName}`);
        
        return resultado;
    }

    /**
     * Determina si una fila de tabla contiene datos de materia
     * @param {HTMLElement} fila - Elemento TR de la tabla
     * @returns {boolean} True si la fila contiene una materia
     */
    esFilaMateria(fila) {
        // Buscar celda que contenga clave de materia (4 dígitos)
        const celdas = Array.from(fila.querySelectorAll('td'));
        
        // Revisar primeras celdas buscando patrón de clave
        for (let i = 0; i < Math.min(celdas.length, 5); i++) {
            const texto = celdas[i].textContent.trim();
            if (/^\d{4}$/.test(texto)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extrae datos de materia de una fila del DOM
     * @param {HTMLElement} fila - Fila de tabla con datos de materia
     * @param {string} grupo - Código del grupo actual
     * @param {string} semestre - Número de semestre actual
     * @returns {Object|null} Objeto con datos de materia o null si falla
     */
    extraerMateriaDeDOM(fila, grupo, semestre) {
        const celdas = Array.from(fila.querySelectorAll('td, th'));
        
        // Localizar índice de celda con clave de materia
        let claveIndex = -1;
        for (let i = 0; i < Math.min(celdas.length, 9); i++) {
            const texto = celdas[i].textContent.trim();
            if (/^\d{4}$/.test(texto)) {
                claveIndex = i;
                break;
            }
        }
        
        if (claveIndex === -1) {
            console.log('No se encontró clave en fila:', fila.textContent.substring(0, 100));
            return null;
        }
        
        try {
            // Extraer datos de celdas consecutivas
            const clave = celdas[claveIndex].textContent.trim();
            const nombre = celdas[claveIndex + 1] ? celdas[claveIndex + 1].textContent.trim() : 'Sin nombre';
            const horarioRaw = celdas[claveIndex + 2] ? celdas[claveIndex + 2].textContent.trim() : '';
            const profesor = celdas[claveIndex + 3] ? celdas[claveIndex + 3].textContent.trim() : 'Sin profesor';
            const salon = celdas[claveIndex + 4] ? celdas[claveIndex + 4].textContent.trim() : 'Sin salón';
            
            const horarios = this.parsearHorario(horarioRaw);
            
            console.log(`   - Clave: ${clave}, Horario: ${horarioRaw}, Profesor: ${profesor.substring(0, 20)}...`);
            
            return {
                clave,
                nombre,
                semestre,
                grupo,
                profesor,
                horarios,
                salon,
                horario_raw: horarioRaw
            };
        } catch (error) {
            console.error('Error extrayendo materia:', error);
            return null;
        }
    }

    /**
     * Extrae número de semestre del texto de encabezado
     * @param {string} texto - Texto de fila con información de semestre
     * @returns {string} Número de semestre o "00" si no se encuentra
     */
    extraerSemestre(texto) {
        const match = texto.match(/SEMESTRE:\s*(\d+)/);
        return match ? match[1] : "00";
    }

    /**
     * Extrae código de grupo del texto de encabezado
     * @param {string} texto - Texto de fila con información de grupo
     * @returns {string} Código de grupo o "0000" si no se encuentra
     */
    extraerGrupo(texto) {
        const match = texto.match(/GRUPO:\s*(\w+)/);
        return match ? match[1] : "0000";
    }

    /**
     * Parsea string de horario y lo convierte en array de objetos estructurados
     * @param {string} horarioStr - String con formato "LU,MA 08:00 a 10:00"
     * @returns {Array} Array de objetos con día, hora inicio y hora fin
     */
    parsearHorario(horarioStr) {
        if (!horarioStr.trim()) return [];
        
        const horarios = [];
        const segmentos = horarioStr.split(' y ');
        
        segmentos.forEach(segmento => {
            segmento = segmento.trim();
            const match = segmento.match(/([A-Z,]+)\s+(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})/);
            
            if (match) {
                const diasStr = match[1];
                const horaInicio = match[2];
                const horaFin = match[3];
                
                const dias = diasStr.split(',');
                dias.forEach(dia => {
                    dia = dia.trim();
                    if (this.diasMap[dia]) {
                        horarios.push({
                            dia,
                            dia_nombre: this.diasMap[dia],
                            inicio: horaInicio,
                            fin: horaFin
                        });
                    }
                });
            }
        });
        
        return horarios;
    }

    /**
     * Agrega datos de materia a la estructura principal organizándolos por clave
     * @param {Object} materiasData - Objeto contenedor de todas las materias
     * @param {Object} materia - Datos de materia individual a agregar
     */
    agregarMateriaAEstructura(materiasData, materia) {
        const clave = materia.clave;
        
        // Crear entrada de materia si no existe
        if (!materiasData[clave]) {
            materiasData[clave] = {
                nombre: materia.nombre,
                semestre: materia.semestre,
                grupos: []
            };
        }
        
        // Agregar grupo a la materia
        const grupoData = {
            grupo: materia.grupo,
            profesor: materia.profesor,
            horarios: materia.horarios,
            salon: materia.salon
        };
        
        materiasData[clave].grupos.push(grupoData);
    }

    /**
     * Ejecuta scraping de todas las carreras configuradas
     * @returns {Object} Objeto con datos de todas las carreras procesadas
     */
    async scrapeAll() {
        const resultado = {
            carreras: {},
            fecha_actualizacion: new Date().toISOString(),
            total_carreras: Object.keys(this.carreras).length
        };
        
        // Procesar cada carrera secuencialmente
        for (const [carreraKey, carreraNombre] of Object.entries(this.carreras)) {
            console.log(`Procesando: ${carreraNombre}`);
            
            const carreraData = await this.scrapeCarrera(carreraKey);
            if (carreraData) {
                resultado.carreras[carreraData.codigo] = carreraData;
                
                const totalMaterias = Object.keys(carreraData.materias).length;
                const totalGrupos = Object.values(carreraData.materias)
                    .reduce((sum, m) => sum + m.grupos.length, 0);
                    
                console.log(`${carreraNombre}: ${totalMaterias} materias, ${totalGrupos} grupos`);
            }
            
            // Delay entre carreras para evitar sobrecarga del servidor
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        return resultado;
    }
}

/**
 * Función principal que ejecuta el scraping completo
 * Procesa todas las carreras y guarda los resultados en archivos JSON
 */
async function main() {
    const scraper = new FESAcatlanScraper();
    
    try {
        console.log('Iniciando scraping de todas las carreras...');
        const resultado = await scraper.scrapeAll();
        
        if (resultado) {
            console.log('✅ Extracción exitosa de todas las carreras');
            console.log(`📊 Total carreras procesadas: ${resultado.total_carreras}`);
            
            // Crear directorio de salida si no existe
            const materiasDir = path.join(process.cwd(), 'materias');
            if (!fs.existsSync(materiasDir)) {
                fs.mkdirSync(materiasDir, { recursive: true });
            }
            
            // Guardar archivo consolidado con todas las carreras
            const fileName = path.join(materiasDir, 'todas_carreras.json');
            fs.writeFileSync(fileName, JSON.stringify(resultado, null, 2), 'utf8');
            console.log(`📄 Guardado en: ${fileName}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar función principal
main();
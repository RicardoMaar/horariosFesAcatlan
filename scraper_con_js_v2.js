// FES Acatlán Scraper usando DOM directo
import fetch from 'node-fetch';
import path from 'path';
import { JSDOM } from 'jsdom';
import fs from 'fs';
const { DOMParser } = new JSDOM().window;

class FESAcatlanScraper {
    constructor() {
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
        
        this.diasMap = {
            'LU': 'Lunes',
            'MA': 'Martes', 
            'MI': 'Miércoles',
            'JU': 'Jueves',
            'VI': 'Viernes',
            'SA': 'Sábado'
        };
    }

    async scrapeCarrera(carreraKey) {
        const baseUrl = "https://escolares.acatlan.unam.mx/HISTORIA/";
        let cookies = '';
        
        try {
            console.log('1. Haciendo GET inicial...');
            
            // Paso 1: GET Menu (establecer cookies)
            const menuResponse = await fetch(baseUrl + "MenuGrupoSIsaturacionORDInarioAlumno.ASP", {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!menuResponse.ok) {
                throw new Error(`GET failed: ${menuResponse.status}`);
            }
            
            // Extraer cookies correctamente
            const setCookieHeaders = menuResponse.headers.raw()['set-cookie'];
            if (setCookieHeaders) {
                cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
            }
            console.log('2. Cookies extraídas:', cookies.substring(0, 100) + '...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('3. Haciendo POST...');
            
            // Paso 2: POST Datos - usar URLSearchParams en lugar de FormData
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
            
            // Actualizar cookies si hay nuevas
            const newCookies = postResponse.headers.raw()['set-cookie'];
            if (newCookies) {
                const additionalCookies = newCookies.map(cookie => cookie.split(';')[0]).join('; ');
                cookies = cookies + '; ' + additionalCookies;
            }
            
            console.log('4. POST exitoso, esperando...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('5. Haciendo GET final...');
            
            // Paso 3: GET Resultados
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
            
            // Debug: buscar cualquier tabla y extraer si existe
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
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            return this.extraerHorarios(doc, carreraKey);
            
        } catch (error) {
            console.error('Error en scraping:', error);
            return null;
        }
    }

    extraerHorarios(doc, carreraKey) {
        // Buscar tabla por cualquier selector posible
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
        
        filas.forEach((fila, index) => {
            const textoFila = fila.textContent.trim();
            
            // Detectar fila de grupo (patrón: número + SEMESTRE)
            if (/^\d+\s+SEMESTRE:/.test(textoFila)) {
                currentSemestre = this.extraerSemestre(textoFila);
                currentGrupo = this.extraerGrupo(textoFila);
                console.log(`GRUPO: ${currentGrupo}, SEMESTRE: ${currentSemestre}`);
                return;
            }
            
            // Detectar fila de materia
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
        
        const resultado = {
            codigo,
            nombre,
            fecha_consulta: new Date().toISOString(),
            materias: materiasData
        };
        
        // Guardar JSON
        const materiasDir = path.join(process.cwd(), 'materias');
        const fileName = path.join(materiasDir, `horarios_${nombre.toLowerCase().replace(/\s+/g, '_')}.json`);
        fs.writeFileSync(fileName, JSON.stringify(resultado, null, 2), 'utf8');
        
        const totalMaterias = Object.keys(materiasData).length;
        const totalGrupos = Object.values(materiasData).reduce((sum, m) => sum + m.grupos.length, 0);
        
        console.log(`\n✅ EXTRACCIÓN EXITOSA`);
        console.log(`📊 ${nombre}: ${totalMaterias} materias, ${totalGrupos} grupos`);
        console.log(`📄 Guardado en: ${fileName}`);
        
        return resultado;
    }

    esFilaMateria(fila) {
        // Buscar celda que contenga clave de 4 dígitos
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

    extraerMateriaDeDOM(fila, grupo, semestre) {
        const celdas = Array.from(fila.querySelectorAll('td, th'));
        
        // Buscar clave de 4 dígitos en las primeras celdas
        let claveIndex = -1;
        for (let i = 0; i < Math.min(celdas.length, 8); i++) {
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

    extraerSemestre(texto) {
        const match = texto.match(/SEMESTRE:\s*(\d+)/);
        return match ? match[1] : "00";
    }

    extraerGrupo(texto) {
        const match = texto.match(/GRUPO:\s*(\w+)/);
        return match ? match[1] : "0000";
    }

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

    agregarMateriaAEstructura(materiasData, materia) {
        const clave = materia.clave;
        
        if (!materiasData[clave]) {
            materiasData[clave] = {
                nombre: materia.nombre,
                semestre: materia.semestre,
                grupos: []
            };
        }
        
        const grupoData = {
            grupo: materia.grupo,
            profesor: materia.profesor,
            horarios: materia.horarios,
            salon: materia.salon
        };
        
        materiasData[clave].grupos.push(grupoData);
    }

    async scrapeAll() {
        const resultado = {
            carreras: {},
            fecha_actualizacion: new Date().toISOString(),
            total_carreras: Object.keys(this.carreras).length
        };
        
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
            
            // Delay entre carreras
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        return resultado;
    }
}

// Uso
async function main() {
    const scraper = new FESAcatlanScraper();
    
    try {
        console.log('Iniciando scraping de todas las carreras...');
        const resultado = await scraper.scrapeAll();
        
        if (resultado) {
            console.log('✅ Extracción exitosa de todas las carreras');
            console.log(`📊 Total carreras procesadas: ${resultado.total_carreras}`);
            
            // Guardar como JSON completo
            const materiasDir = path.join(process.cwd(), 'materias');
            if (!fs.existsSync(materiasDir)) {
                fs.mkdirSync(materiasDir, { recursive: true });
            }
            
            const fileName = path.join(materiasDir, 'todas_carreras.json');
            fs.writeFileSync(fileName, JSON.stringify(resultado, null, 2), 'utf8');
            console.log(`📄 Guardado en: ${fileName}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Uso
// async function main() {
//     const scraper = new FESAcatlanScraper();
    
//     try {
//         console.log('Iniciando scraping de Actuaría...');
//         const resultado = await scraper.scrapeCarrera("20321,Actuaría");
        
//         if (resultado) {
//             const totalMaterias = Object.keys(resultado.materias).length;
//             const totalGrupos = Object.values(resultado.materias)
//                 .reduce((sum, m) => sum + m.grupos.length, 0);
                
//             console.log('✅ Extracción exitosa');
//             console.log(`📊 ${resultado.nombre}: ${totalMaterias} materias, ${totalGrupos} grupos`);
            
//             // Mostrar muestra
//             const materiasSample = Object.entries(resultado.materias).slice(0, 3);
//             console.log('\n📋 Muestra de materias:');
//             materiasSample.forEach(([clave, materia], i) => {
//                 console.log(`${i+1}. ${clave} - ${materia.nombre.substring(0, 50)}...`);
//                 console.log(`   Semestre: ${materia.semestre}, Grupos: ${materia.grupos.length}`);
//             });
            
//             // Guardar como JSON
//             const jsonStr = JSON.stringify(resultado, null, 2);
//             console.log('\n📄 JSON generado:', jsonStr.length, 'caracteres');
//         }
        
//     } catch (error) {
//         console.error('❌ Error:', error);
//     }
// }

// Ejecutar
main();
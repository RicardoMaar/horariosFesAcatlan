// Scraper de planes de estudio FES Acatlán → horas/semana esperadas por clave.
// POC: Derecho (carrera 20721, página id=20). SIEMPRE toma el plan MÁS RECIENTE.
// Salida: data/planes/<codigo>.json  { clave: { nombre, semestre, creditos, horas_semana, plan } }
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
const UA = 'Mozilla/5.0 (compatible; horariosFesAcatlan/1.0)';
const BASE = 'https://www.acatlan.unam.mx/';

// POC: una sola carrera. Al escalar, esto será una tabla de las 17.
const CARRERA = { codigo: '20721', nombre: 'Derecho', pageId: 20, semestresPOC: ['1', '2', '3'] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Descarga la página de la carrera y devuelve los PDFs del plan MÁS RECIENTE.
async function inventarioPlan(pageId, semestresFiltro) {
  const html = await (await fetch(`${BASE}index.php?id=${pageId}`, { headers: { 'User-Agent': UA } })).text();
  const links = [...new Set(
    [...html.matchAll(/files\/PlanesDeEstudio\/([^"'\s>]+\.pdf)/gi)].map((m) => m[1])
  )];
  // Agrupar por carpeta (Carrera+Año) y elegir el año MÁS RECIENTE.
  const carpetas = [...new Set(links.map((l) => l.split('/')[0]))];
  const masReciente = carpetas
    .map((c) => ({ c, y: parseInt((c.match(/(\d{4})/) || [])[1] || '0', 10) }))
    .sort((a, b) => b.y - a.y)[0];
  const plan = masReciente.c;
  let pdfs = links.filter((l) => l.startsWith(plan + '/'));
  if (semestresFiltro) pdfs = pdfs.filter((l) => semestresFiltro.includes(l.split('/')[1]));
  return { plan, pdfs };
}

// Extrae clave, semestre, créditos y horas/semana de un PDF de programa de asignatura.
function parsearPrograma(texto) {
  const t = texto.replace(/\r/g, '');
  // "1111 Primero 8 Etapa formativa ..."
  const mClave = t.match(/\n\s*(\d{3,4})\s+(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|S[ée]ptimo|Octavo|Noveno|D[ée]cimo)\s+(\d+)/i);
  // Bloque Horas: "Total: 4 Total: 64" → primer número = semana
  const mTotal = t.match(/Total:\s*(\d+)\s+Total:\s*(\d+)/i);
  const mTeo = t.match(/Te[óo]ricas:\s*(\d+)\s+Te[óo]ricas:\s*(\d+)/i);
  const mPra = t.match(/Pr[áa]cticas:\s*(\d+)\s+Pr[áa]cticas:\s*(\d+)/i);
  const horasSemana = mTotal ? parseInt(mTotal[1], 10)
    : (mTeo && mPra ? parseInt(mTeo[1], 10) + parseInt(mPra[1], 10) : null);
  return {
    clave: mClave ? mClave[1] : null,
    semestre: mClave ? mClave[2] : null,
    creditos: mClave ? parseInt(mClave[3], 10) : null,
    horas_semana: horasSemana,
    teoricas_semana: mTeo ? parseInt(mTeo[1], 10) : null,
    practicas_semana: mPra ? parseInt(mPra[1], 10) : null,
  };
}

async function main() {
  const { codigo, semestresPOC } = CARRERA;
  console.log(`Plan de estudios de ${CARRERA.nombre} (id=${CARRERA.pageId})...`);
  const { plan, pdfs } = await inventarioPlan(CARRERA.pageId, semestresPOC);
  console.log(`Plan más reciente: ${plan} — ${pdfs.length} PDFs (semestres ${semestresPOC.join(',')})`);

  const salida = { codigo, nombre: CARRERA.nombre, plan, fecha_consulta: new Date().toISOString(), materias: {} };
  let ok = 0, fail = 0;
  for (const rel of pdfs) {
    const url = `${BASE}files/PlanesDeEstudio/${rel}`;
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = Buffer.from(await resp.arrayBuffer());
      const { text } = await new PDFParse({ data: buf }).getText();
      const info = parsearPrograma(text || '');
      if (!info.clave || info.horas_semana == null) {
        console.warn(`  ⚠️ sin clave/horas: ${rel}`);
        fail++;
      } else {
        salida.materias[info.clave] = {
          nombre: decodeURIComponent(rel.split('/').pop().replace(/\.pdf$/, '')).replace(/-/g, ' '),
          semestre: info.semestre,
          creditos: info.creditos,
          horas_semana: info.horas_semana,
          teoricas_semana: info.teoricas_semana,
          practicas_semana: info.practicas_semana,
        };
        ok++;
        console.log(`  ✓ ${info.clave} · ${info.horas_semana}h/sem · ${rel.split('/').pop()}`);
      }
      await sleep(300);
    } catch (e) {
      console.warn(`  ✗ ${rel}: ${e.message}`);
      fail++;
    }
  }

  const dir = path.join(dataDir, 'planes');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${codigo}.json`), JSON.stringify(salida, null, 2));
  console.log(`\nGuardado data/planes/${codigo}.json — ${ok} materias, ${fail} fallos.`);
}

main();

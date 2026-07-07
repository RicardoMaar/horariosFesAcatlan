// Scraper de planes de estudio FES Acatlán → horas/semana esperadas por clave.
// Recorre las 16 carreras (todos los semestres) cargando TODOS los planes vigentes
// (nuevo + viejos aún en reinscripción). 3 fuentes: PDF directo / endpoint / DGAE+PDF.
// Salida: data/planes/<codigo>.json  { clave: { nombre, semestre, creditos, horas_semana, plan } }
// Uso: `node planes.mjs`            → todas las carreras
//      `node planes.mjs 20721`      → solo esa carrera (debug)
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

// Tabla verificada carrera → página del plan (id de acatlan.unam.mx/index.php?id=).
// Los pageId se confirmaron leyendo la carpeta PlanesDeEstudio que expone cada página.
// OJO: RRII escolarizada = id 33 (id 34 es RRII-SUA, sistema abierto, plan distinto).
// Periodismo (20424) no tiene página de plan localizable y no tiene horarios cargados → se omite.
export // `endpoint`: carreras cuyo PDF de plan NO imprime la clave, pero cuyo sitio
// departamental expone un endpoint Django que devuelve {clave, nombre, url→PDF}
// por semestre. Así la clave es autoritativa (del endpoint) y las horas salen
// del PDF apuntado por `url` — sin adivinar por nombre.
const CARRERAS = [
  { codigo: '20321', nombre: 'Actuaría', pageId: 16,
    endpoint: { origin: 'https://actuaria.acatlan.unam.mx', paths: ['/escolares/temarios/2014/'], semestres: 8 } },
  { codigo: '20121', nombre: 'Arquitectura', pageId: 17 },
  { codigo: '20425', nombre: 'Comunicación', pageId: 18 },
  // Carreras de "plan dividido" (tronco + orientaciones) migradas al puente DGAE con
  // matching POR GENERACIÓN (dgae.multigen). Cada generación vigente cruza contra SU
  // carpeta de PDF (vieja↔plan viejo, nueva↔plan nuevo), así una clave nunca hereda
  // horas de la otra generación. En la carpeta nueva el archivo trae la clave en el
  // nombre → se toma directo; en la vieja se cruza por nombre. Ver README-planes.md.
  { codigo: '20422', nombre: 'Ciencias Políticas y Admon. Pública', pageId: 19,
    dgae: { plt: 204, crr: 303, multigen: true,
      pde: [2122, 4188, 4189, 4190, 1132, 1133, 1134, 1135] } }, // 2020 (tronco+3 orient.) + 2005
  { codigo: '20721', nombre: 'Derecho', pageId: 20,
    dgae: { plt: 207, crr: 305, multigen: true,
      pde: [2301, 4518, 4519, 4520, 4521, 4522, 4523, 4524, 4525, 1588] } }, // 2026 (tronco+8 orient.) + 2013
  { codigo: '20226', nombre: 'Diseño Gráfico', pageId: 23 },
  // Economía no imprime clave en el PDF, pero DGAE-SIAE (plantel Acatlán 208,
  // plan más reciente 2136 = Plan 2021) da clave↔nombre. Las horas salen del PDF
  // del plan (folder más reciente, Economia-2020) cruzando por nombre EXACTO.
  // `aliases`: nombre-normalizado-DGAE → nombre-normalizado-archivo, para los
  // casos donde DGAE abrevia y el match exacto no es posible (deterministas).
  // Planes VIGENTES (vigencia ≠ "NO" en …&acc=pde): conviven nuevo ingreso + los que
  // avanzan en el plan viejo. Economía: 2136 (2021, primer ingreso) — el 2005 (1145)
  // ya no tiene materias en el horario, se incluye por si reaparece algún rezagado.
  { codigo: '20821', nombre: 'Economía', pageId: 24,
    dgae: { plt: 208, crr: 306, pde: [2136, 1145] },
    // Aliases deterministas para casos que la subsecuencia no resuelve:
    // (a) DGAE abrevia soltando una letra intermedia que rompe la subsecuencia;
    // (b) pares I/II/III donde la abreviatura es subsecuencia de varios → ambiguo.
    aliases: {
      'CONTABILIDADSOCIALYCTASNALESI': 'CONTABILIDADSOCIALYCUENTASNACIONALESI',
      'CONTABILIDADSOCIALYCTASNALESII': 'CONTABILIDADSOCIALYCUENTASNACIONALESII',
      'SISTEMAECONPRODUCMERCANTTEORVAL': 'SISTEMAECONOMICOPRODUCCIONMERCANTILYTEORIADELVALOR',
      'TEORIADELCONSUMIDORDELPRODUCTOR': 'TEORIADELCONSUMIDORYDELPRODUCTOR',
      'HISTORIAECONOMICAYSOCIALMUNDI': 'HISTORIAECONOMICAYSOCIALMUNDIALI',
      'HISTORIAECONOMICAYSOCIALMUNDII': 'HISTORIAECONOMICAYSOCIALMUNDIALII',
      'HISTORIAECONOMICASOCIALMEXICOI': 'HISTORIAECONOMICAYSOCIALDEMEXICOI',
      'METODOLCIENCIASSOCIALESEINVESTIG': 'METODOLOGIADELASCIENCIASSOCIALESYLAINVESTIGACION',
      'SEMINVESTIGPROFUNDIZACTEORICAI': 'SEMINARIODEINVESTIGACIONPROFUNDIZACIONTEORICAI',
      'SEMINVESTIGPROCESOINVESTIGACI': 'SEMINARIODEINVESTIGACIONPROCESODEINVESTIGACIONI',
      'SEMINVESTPROCESOINVESTIGACII': 'SEMINARIODEINVESTIGACIONPROCESODEINVESTIGACIONII',
      'SEMINVESTPROFUNDIZACTEORICAII': 'SEMINARIODEINVESTIGACIONPROFUNDIZACINTEORICAII',
      'SEMINVESTPROCESOINVESTIGACIII': 'SEMINARIODEINVESTIGACIONPROCESODEINVESTIGACIONIII',
      // El archivo "Macroeconomia-Heterodoxa.pdf" tiene typo: por dentro es
      // "MICROECONOMÍA HETERODOXA" (clave 2521). Verificado abriendo el PDF.
      'MICROECONOMIAHETERODOXA': 'MACROECONOMIAHETERODOXA',
    } },
  { codigo: '24121', nombre: 'Enseñanza de Inglés', pageId: 25 },
  { codigo: '21011', nombre: 'Filosofía', pageId: 26,
    dgae: { plt: 210, crr: 411, multigen: true,
      pde: [2255, 4381, 4382, 4383, 4384, 1180] } }, // 2024 (tronco+4 orient.) + 2006
  { codigo: '21021', nombre: 'Historia', pageId: 27,
    dgae: { plt: 210, crr: 412, multigen: true,
      pde: [2275, 4410, 4411, 4412, 4413, 4414, 4415, 4416, 1158] } }, // 2025 (tronco+7 orient.) + 2006
  { codigo: '21121', nombre: 'Ingeniería Civil', pageId: 28 },
  { codigo: '21013', nombre: 'Lengua y Literatura Hispánicas', pageId: 29,
    dgae: { plt: 210, crr: 414, multigen: true,
      pde: [2271, 4400, 4401, 4402, 1156] } }, // 2025 (tronco+3 orient.) + 2006
  { codigo: '24022', nombre: 'Matemáticas. Apl. y Comp.', pageId: 31,
    endpoint: { origin: 'https://mac.acatlan.unam.mx', // Plan 2014, 4 orientaciones (tronco común + terminales)
      paths: ['/escolares/temarios/1644/', '/escolares/temarios/1645/', '/escolares/temarios/1646/', '/escolares/temarios/1647/'], semestres: 8 } },
  { codigo: '21025', nombre: 'Pedagogía', pageId: 32,
    dgae: { plt: 210, crr: 421, multigen: true,
      pde: [2303, 4526, 4527, 4528, 4529, 4530, 4531, 4532, 1263, 1264, 1265, 1266, 1267, 1268, 1269] } }, // 2026 (tronco+7 orient.) + 2007
  // RRII: el horario es PRESENCIAL. En DGAE conviven planes SUAYED (a distancia) y
  // presenciales; SOLO se incluyen los pde PRESENCIALES vigentes: 2020 (2123 tronco +
  // 4186/4187 orientaciones) y 2005 (1128-1131). La única carpeta de PDFs de Acatlán es
  // la del 2020 ("…2019"); las claves del 2005 sacan horas por fallback cross-generación.
  { codigo: '20421', nombre: 'Relaciones Internacionales', pageId: 33,
    dgae: { plt: 204, crr: 310, multigen: true, pde: [2123, 4186, 4187, 1128, 1129, 1130, 1131] } },
  // Sociología: planes VIGENTES = 2022 (2163 tronco "primer ingreso" + 4233..4236,
  // 4 orientaciones terminales) Y 2005 (1144, aún en "reinscripción": ~32 claves del
  // horario actual vienen SOLO de él, alumnos avanzados). Se une la tabla clave↔nombre
  // de todos; las horas siempre salen del PDF del plan vigente (folder Sociologia).
  { codigo: '20423', nombre: 'Sociología', pageId: 35,
    dgae: { plt: 204, crr: 311, multigen: true, pde: [2163, 4233, 4234, 4235, 4236, 1144] } },
];

// Equivalencias curadas — materias RENOMBRADAS entre planes.
// La clave del HORARIO (plan viejo: PDF muerto/link 404 o materia renombrada) hereda
// las horas de la clave del PLAN NUEVO ya emparejada. Cada par se verificó a mano y
// cumple las 3 condiciones anti-falso-positivo:
//   (a) el nombre es esencialmente el mismo (renombre, no otra materia ni otro tomo
//       de una secuencia I/II/III),
//   (b) las horas del plan nuevo == moda de horas de los grupos del horario, y
//   (c) la clave nueva NO aparece en el horario (no coexisten como materias distintas).
// El detector revalida contra la moda de grupos, así que un error de curación solo
// degradaría a modo outlier (nunca produce un falso positivo). Ver README-planes.md.
// Formato: { codigoCarrera: { claveVieja: claveNuevaDelPlan } }. El valor puede ser un
// string (la clave nueva, hereda su nombre) o un objeto { tgt, nombre } cuando la clave
// vieja NO está en la fuente del plan y hay que darle su propio nombre (caso Arquitectura,
// donde la clave del horario es del plan 2027 y la carpeta de PDF es la del 2012).
const EQUIVALENCIAS = {
  '20721': { '1707': '1710' }, // Derecho: "Derecho del Trabajo Parte Sustantiva" (16 grupos, 6h)
  '21025': { '0105': '0240', '0111': '0244' }, // Pedagogía: "Diseño/Elab.→Materiales y Rec. Didácticos"; "Hist. Educ. América Latina"
  '21021': { '0042': '0171' }, // Historia: "Hist. Iglesia en Nueva España" ≡ "…Novohispana" (4h)
  '20422': { '1761': '2706', '2126': '1134' }, // C. Políticas: "Sist. de Partidos y Sist. Electorales" (4h); "Taller de Redacción e Investig. Documental" (6h)
  '20421': { '2703': '1768' }, // RRII: "(Seminario de) Análisis del Sector Externo de la Economía Mexicana" (4h)
  // Arquitectura: el horario ya trae 1er semestre del plan 2027 (muchos grupos), pero
  // Acatlán aún no publica sus PDFs; la carpeta es la del plan 2012. Cada clave 2027 hereda
  // las horas de su materia correspondiente del MISMO semestre en el 2012 — y solo se incluye
  // si esas horas == la mayoría (aquí unánime) de los grupos 2027 (regla anti-falso-positivo:
  // el valor asignado SIEMPRE coincide con lo que ya marcan los grupos). Los recursadores del
  // 2012 aparecen aparte con la clave vieja y pocos grupos (coexisten, pero es la misma materia).
  '20121': {
    '1108': { tgt: '1100', nombre: 'CULTURA, ARTE Y ARQUITECTURA' },      // ← Arte y arquitectura (3h)
    '1109': { tgt: '1105', nombre: 'DIBUJO TECNICO ARQUITECTONICO' },     // ← Métodos y técnicas de dibujo (6h)
    '1111': { tgt: '1103', nombre: 'GEOMETRIA DESCRIPTIVA' },             // ← Geometría descriptiva (5h, nombre idéntico)
    '1113': { tgt: '1106', nombre: 'PROYECTO ARQUITECTONICO BASICO I' },  // ← Proyectos arquitectónicos I (6h)
  },
};

// Aplica EQUIVALENCIAS al objeto de materias ya emparejadas: cada clave "src" hereda las
// horas de su "tgt" ya cubierto. Devuelve cuántas agregó. Usada por las rutas endpoint y
// PDF-directo (la ruta DGAE las aplica sobre su Map interno para nombrar src desde DGAE).
function aplicarEquivalencias(materias, codigo) {
  const eq = EQUIVALENCIAS[codigo];
  if (!eq) return 0;
  let n = 0;
  for (const [src, spec] of Object.entries(eq)) {
    const tgt = typeof spec === 'string' ? spec : spec.tgt;
    if (materias[src] || !materias[tgt]) continue;   // ya cubierta, o el tgt no se emparejó
    const t = materias[tgt];
    materias[src] = {
      nombre: (typeof spec === 'object' && spec.nombre) || t.nombre,
      ...(t.semestre !== undefined ? { semestre: t.semestre } : {}),
      horas_semana: t.horas_semana, teoricas_semana: t.teoricas_semana, practicas_semana: t.practicas_semana,
    };
    n++;
  }
  return n;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fetch con reintentos: la corrida baja cientos de PDFs y un fallo transitorio de red
// (timeout) haría desaparecer esa materia en silencio. Reintenta con backoff.
async function fetchBuf(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) { if (r.status === 404) return null; throw new Error(`HTTP ${r.status}`); }
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (i === tries - 1) throw e; await sleep(600 * (i + 1)); }
  }
}

// Descarga la página de la carrera y devuelve los links a PDFs de plan.
// OJO: algunos nombres de archivo traen ESPACIOS (p.ej. "…CAPITALISTA- REPRODUCCION…
// .pdf"). No excluir \s o se cae ese PDF; cortar solo en comillas/ángulos, no-greedy.
async function linksPlan(pageId) {
  const html = await (await fetch(`${BASE}index.php?id=${pageId}`, { headers: { 'User-Agent': UA } })).text();
  return [...new Set(
    [...html.matchAll(/files\/PlanesDeEstudio\/([^"'<>]+?\.pdf)/gi)].map((m) => m[1].trim())
  )];
}

// Carpetas de plan (Carrera+Año), ordenadas de MÁS VIEJA a MÁS NUEVA.
// Una carpeta sin año (p.ej. "Derecho") es el plan viejo; "Derecho2025" es nuevo.
function carpetasPorAnio(links) {
  return [...new Set(links.map((l) => l.split('/')[0]))]
    .map((c) => ({ c, y: parseInt((c.match(/(\d{4})/) || [])[1] || '0', 10) }))
    .sort((a, b) => a.y - b.y);
}

// Devuelve los PDFs del plan MÁS RECIENTE (para el puente DGAE, donde las horas
// deben salir del plan vigente).
export async function inventarioPlan(pageId) {
  const links = await linksPlan(pageId);
  if (links.length === 0) return { plan: null, pdfs: [] };
  const plan = carpetasPorAnio(links).at(-1).c; // el de año mayor
  return { plan, pdfs: links.filter((l) => l.startsWith(plan + '/')) };
}

// Devuelve los PDFs de TODAS las carpetas de plan (viejo + nuevo). Para carreras
// de PDF directo donde conviven generaciones: cada clave trae sus horas en su
// propio PDF, así que se cargan todas. Orden viejo→nuevo: al indexar por clave,
// una asignación posterior (plan nuevo) sobrescribe a la vieja si colisionan.
export async function inventarioPlanTodas(pageId) {
  const links = await linksPlan(pageId);
  if (links.length === 0) return { plan: null, pdfs: [], carpetas: [] };
  const carpetas = carpetasPorAnio(links);
  const pdfs = carpetas.flatMap(({ c }) => links.filter((l) => l.startsWith(c + '/')));
  return { plan: carpetas.map((x) => x.c).join('+'), pdfs, carpetas: carpetas.map((x) => x.c) };
}

export const ORDINAL = 'Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|S[ée]ptimo|Octavo|Noveno|D[ée]cimo';

// Extrae clave, semestre y horas/semana de un PDF de programa de asignatura.
// Cubre las dos familias de plantilla de FES Acatlán. Invariante universal:
//   horas/semana = teóricas + prácticas (+ laboratorio).
export function parsearPrograma(texto, filename = '') {
  const t = texto.replace(/\r/g, '');
  const base = decodeURIComponent((filename.split('/').pop() || '')).replace(/\.pdf$/i, '');

  // ---------- CLAVE (5 fuentes, en orden de confianza) ----------
  const fuentesClave = [
    ['label',    (t.match(/\bCLAVE\s*:?\s*\n?\s*(\d{3,4})\b/i) || [])[1]],           // "CLAVE: 1213" (Familia A)
    ['vertical', (t.match(/\bClave\s*\n\s*(\d{3,4})\b/i) || [])[1]],                 // "Clave\n1135" (Pedagogía)
    ['inline',   (t.match(new RegExp(`\\n\\s*(\\d{3,4})\\s+(?:${ORDINAL}|\\d+\\s*[º°])`, 'i')) || [])[1]], // "1109 Primero"
    ['archivo',  (base.match(/^(\d{3,4})[-_ ]/) || [])[1]],                          // "2165-HISTORIA-..."
    ['archivo2', (base.match(/CLAVE[_-]?(\d{3,4})/i) || [])[1]],                     // "..._CLAVE_1042"
  ];
  const hit = fuentesClave.find(([, v]) => v);
  const clave = hit ? hit[1] : null;
  const claveFuente = hit ? hit[0] : null;

  // ---------- SEMESTRE (best effort; la clave es la llave de cruce) ----------
  const mSem = t.match(new RegExp(`\\b(${ORDINAL})\\b`, 'i')) ||
               t.match(/SEMESTRE\s*:?\s*\n?\s*(\d)\s*[º°]?/i);
  const semestre = mSem ? mSem[1] : null;

  // ---------- HORAS / SEMANA ----------
  let horas_semana = null, teoricas = null, practicas = null;

  // Familia B: primera "Teóricas:" + primera "Prácticas:" = columna Semana.
  if (/Te[óo]ricas\s*:/i.test(t)) {
    const tt = (t.match(/Te[óo]ricas\s*:\s*(\d+)/i) || [])[1];
    const pp = (t.match(/Pr[áa]cticas\s*:\s*(\d+)/i) || [])[1];
    if (tt != null && pp != null) { teoricas = +tt; practicas = +pp; horas_semana = +tt + +pp; }
  }

  // Familia D: template de dos columnas "Semana | Semestre" SIN dos puntos, donde cada
  // renglón repite la etiqueta: "Teóricas 4 Teóricas 64" / "Prácticas 0 Prácticas 0". El
  // 1er número de cada renglón es la columna Semana. Aparece en planes nuevos (Sociología
  // 2022, etc.). El patrón "etiqueta N etiqueta M" (repetida) es su firma única, así que no
  // choca con Familia A/B. horas/semana = teóricas(semana) + prácticas(semana).
  if (horas_semana == null) {
    const tt = (t.match(/Te[óo]ricas\s+(\d+)\s+Te[óo]ricas\s+\d+/i) || [])[1];
    const pp = (t.match(/Pr[áa]cticas\s+(\d+)\s+Pr[áa]cticas\s+\d+/i) || [])[1];
    if (tt != null && pp != null) { teoricas = +tt; practicas = +pp; horas_semana = +tt + +pp; }
  }

  // Familia A/C: fila de 4-7 enteros. Invariante universal: el 1º número es
  // horas-al-semestre ≈ 16 × (horas/semana). Dos variantes:
  //   5-7 cols: [alSem, semana, teo, pra, (lab), cred] → semana = teo+pra(+lab).
  //   4 cols  : [alSem, teo, pra, cred] (Sociología, sin columna "semana") → semana = teo+pra.
  if (horas_semana == null) {
    // Acotar a la cabecera (antes de índice/seriación/objetivo) para no capturar tablas de temas.
    const cabeza = t.split(/ETAPA DE FORMACI[ÓO]N|FASE DE FORMACI[ÓO]N|CICLO DE\s|[ÍI]NDICE TEM[ÁA]TICO|[ÍI]ndice Tem[áa]tico|SERIACI[ÓO]N|Seriaci[óo]n|OBJETIVO/i)[0] || t;
    const runs = [...cabeza.matchAll(/(?:\d{1,3})(?:\s+\d{1,3}){3,6}/g)].map((m) => m[0].trim().split(/\s+/).map(Number));
    const plausibleAlSem = (alSem, semana) => Math.abs(alSem - 16 * semana) <= 2 * semana; // ~16 semanas ± tolerancia
    for (const r of runs) {
      const alSem = r[0];
      if (r.length >= 5) {
        const semana = r[1], comps = r.slice(2, r.length - 1);
        if (comps.length >= 2 && semana > 0 && semana <= 20 && semana === comps.reduce((a, b) => a + b, 0) && plausibleAlSem(alSem, semana)) {
          horas_semana = semana; teoricas = comps[0]; practicas = comps.slice(1).reduce((a, b) => a + b, 0); break;
        }
      } else if (r.length === 4) {
        const teo = r[1], pra = r[2], semana = teo + pra;
        if (semana > 0 && semana <= 20 && plausibleAlSem(alSem, semana)) {
          horas_semana = semana; teoricas = teo; practicas = pra; break;
        }
      }
    }
  }

  return { clave, claveFuente, semestre, horas_semana, teoricas_semana: teoricas, practicas_semana: practicas };
}

// Fuente alterna: endpoint Django departamental (clave↔url→PDF).
// Soporta varios `paths` (planes/orientaciones) que se fusionan por clave.
async function scrapearPorEndpoint(carrera, dir) {
  const { codigo, nombre, endpoint } = carrera;
  const { origin, paths, semestres } = endpoint;
  console.log(`\n=== ${nombre} (${codigo}) [endpoint ${origin}] ===`);

  // Recolecta {clave, nombre, url} de cada path (plan) y todos sus semestres.
  const porClave = new Map();
  for (const epPath of paths) {
    const url = origin + epPath;
    // GET para la cookie csrftoken (que también sirve como token del POST).
    const getResp = await fetch(url, { headers: { 'User-Agent': UA } });
    const token = ((getResp.headers.get('set-cookie') || '').match(/csrftoken=([^;]+)/) || [])[1];
    if (!token) { console.warn(`  ⚠️ ${epPath}: sin csrftoken; se salta.`); continue; }

    for (let s = 0; s < semestres; s++) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'User-Agent': UA, 'Cookie': `csrftoken=${token}`, 'Referer': url,
            'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `client_response=${s}&csrfmiddlewaretoken=${encodeURIComponent(token)}`,
        });
        const arr = await r.json();
        for (const it of arr) {
          const clave = String(it.clave).trim();
          if (clave && it.url && !porClave.has(clave)) {
            porClave.set(clave, { clave, nombre: (it.nombre || '').trim(), url: it.url });
          }
        }
        await sleep(300);
      } catch (e) { console.warn(`  ✗ ${epPath} sem ${s}: ${e.message}`); }
    }
  }
  console.log(`  ${porClave.size} materias con clave desde el endpoint (${paths.length} plan/es)`);

  // 3) Fetch de cada PDF apuntado por url → horas con el parser.
  const salida = { codigo, nombre, plan: `endpoint:${origin}`, fecha_consulta: new Date().toISOString(), materias: {} };
  let ok = 0, fail = 0;
  const sinHoras = [];
  for (const it of porClave.values()) {
    try {
      const buf = Buffer.from(await (await fetch(origin + it.url, { headers: { 'User-Agent': UA } })).arrayBuffer());
      const { text } = await new PDFParse({ data: buf }).getText();
      const info = parsearPrograma(text || '', it.url);
      if (info.horas_semana == null) { sinHoras.push(it.url); fail++; }
      else {
        salida.materias[it.clave] = {
          nombre: it.nombre,
          semestre: info.semestre,
          horas_semana: info.horas_semana,
          teoricas_semana: info.teoricas_semana,
          practicas_semana: info.practicas_semana,
        };
        ok++;
      }
      await sleep(300);
    } catch (e) { console.warn(`  ✗ ${it.url}: ${e.message}`); fail++; }
  }
  const nEquiv = aplicarEquivalencias(salida.materias, codigo);
  if (nEquiv) { ok += nEquiv; console.log(`  equivalencias curadas aplicadas: ${nEquiv}`); }
  fs.writeFileSync(path.join(dir, `${codigo}.json`), JSON.stringify(salida, null, 2));
  console.log(`  → data/planes/${codigo}.json — ${ok} materias [fuente: endpoint] · ${sinHoras.length} sin-horas`);
  return { codigo, nombre, ok, fail, plan: `endpoint:${origin}`, total: porClave.size, fuentes: { endpoint: ok }, sinClaveConHoras: [], sinHoras };
}

const normNombre = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const esSubsecuencia = (a, b) => { let i = 0; for (const ch of b) { if (i < a.length && ch === a[i]) i++; } return i === a.length; };
const bigrams = (s) => { const g = new Set(); for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2)); return g; };
const dice = (a, b) => { const A = bigrams(a), B = bigrams(b); let x = 0; for (const t of A) if (B.has(t)) x++; return (2 * x) / (A.size + B.size || 1); };
// Números romanos (I..XXXIX, cubre siglos XVI-XXI) como conjunto de TOKENS del nombre
// crudo → desambigua pares I/II/III y "S XVI-XVII" vs "S XVIII" (romano final o embebido).
const ROMANTOK = /^(X{0,3})(IX|IV|V?I{0,3})$/;
const romanSet = (raw) => new Set((raw || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().split(/[^A-Z]+/).filter((t) => t.length > 0 && ROMANTOK.test(t)));
const eqSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
// Forma canónica para abreviaturas/marcadores SISTEMÁTICOS de DGAE (determinista, no fuzzy):
//  - prefijo "Temas Selectos" (DGAE "TEM.SEL." / archivo "T_S_de_") → se elimina;
//  - "SIGLO"/"SIGLOS" (DGAE lo escribe, el archivo abrevia "S") → "S";
//  - sufijo "REQ" (marcador DGAE de asignatura-Requisito, no parte del nombre) → se elimina.
const canonAbrev = (s) => s.replace(/^(TEMASSELECTOS|TEMSELECTOS|TEMSEL|TSDELA|TSDEL|TSDE|TS)(DELA|DEL|DE)?/, '').replace(/SIGLOS?/g, 'S').replace(/REQ$/, '');

// Lee la lista de planes (acc=pde) de DGAE y devuelve Map(pde → año de 1a. generación).
// Sirve para agrupar los pde por generación en el modo multigen.
async function dgaeGenPorPde(plt, crr) {
  const url = `https://www.dgae-siae.unam.mx/educacion/planes.php?plt=${plt}&crr=${crr}&acc=pde`;
  const html = new TextDecoder('iso-8859-1').decode(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  const gen = new Map();
  for (const m of html.matchAll(/name="pde" value="(\d+)"[^>]*>\s*<\/td>((?:\s*<td[^>]*>[^<]*<\/td>)+)/g)) {
    const y = (m[2].match(/\b(19|20)\d{2}\b/) || [])[0];
    gen.set(m[1], y ? parseInt(y, 10) : 0);
  }
  return gen;
}

// Parsea todos los PDF de UNA carpeta de plan → { entradas, porClave }:
//   entradas: [{ key, canon, rset, horas, teo, pra }] por PDF con horas (key = nombre
//             normalizado SIN prefijo numérico; canon/rset para el match).
//   porClave: clave (si el archivo/PDF la expone) → horas.
// En las carpetas nuevas el archivo va prefijado con la clave ("1181-Etica-I") → esa
// clave es autoritativa; en las viejas no hay clave y se cruza por nombre. El prefijo
// numérico (clave "1181-" o semestre "01-") se quita para el match por nombre.
async function horasDeCarpeta(carpeta, links) {
  const pdfs = links.filter((l) => l.startsWith(carpeta + '/'));
  const entradas = [], porClave = new Map();
  for (const rel of pdfs) {
    try {
      const buf = await fetchBuf(encodeURI(`${BASE}files/PlanesDeEstudio/${rel}`));
      if (!buf) { await sleep(300); continue; }   // 404 (link muerto en el servidor)
      const { text } = await new PDFParse({ data: buf }).getText();
      const info = parsearPrograma(text || '', rel);
      if (info.horas_semana == null) { await sleep(300); continue; }
      const h = { horas: info.horas_semana, teo: info.teoricas_semana, pra: info.practicas_semana };
      const raw = decodeURIComponent(rel.split('/').pop().replace(/\.pdf$/i, '')).replace(/^\d{1,4}[-_ ]/, '');
      const key = normNombre(raw);
      entradas.push({ key, canon: canonAbrev(key), rset: romanSet(raw), ...h });
      if (info.clave) porClave.set(info.clave, h);
      await sleep(300);
    } catch { /* PDF ilegible / link muerto → se ignora */ }
  }
  return { entradas, porClave };
}

// Matcher POR GENERACIÓN con RECLAMO de PDF (cada PDF a una sola clave, por orden de
// confianza). Cascada: clave-directa → alias → exacto → canónico (Temas Selectos, SIGLO→S)
// → subsecuencia directa única → fuzzy (dice ≥0.72, margen ≥0.08). Los pares I/II/III y
// los siglos se desambiguan por conjunto de romanos. Devuelve Map(clave → {horas,teo,pra,via}).
function matchGen(asigs, mapa, aliases) {
  const out = new Map(), usados = new Set();
  const porKey = new Map(mapa.entradas.map((e) => [e.key, e]));
  const libres = () => mapa.entradas.filter((e) => !usados.has(e.key));
  const claim = (a, e, via) => { out.set(a.clave, { horas: e.horas, teo: e.teo, pra: e.pra, via }); usados.add(e.key); };
  const rfilt = (a, cs) => { if (cs.length <= 1) return cs; const f = cs.filter((e) => eqSet(e.rset, a.rset)); return f.length ? f : cs; };
  const resto = [];
  for (const a of asigs) {
    if (mapa.porClave.has(a.clave)) { const h = mapa.porClave.get(a.clave); out.set(a.clave, { horas: h.horas, teo: h.teo, pra: h.pra, via: 'clave' }); continue; }
    if (aliases[a.norm] && porKey.has(aliases[a.norm])) { claim(a, porKey.get(aliases[a.norm]), 'alias'); continue; }
    if (porKey.has(a.norm)) { claim(a, porKey.get(a.norm), 'exacto'); continue; }
    resto.push(a);
  }
  for (const a of [...resto]) {                       // canónico (abreviaturas sistemáticas)
    const ac = canonAbrev(a.norm); if (ac === a.norm) continue;
    const cs = libres().filter((e) => e.canon === ac);
    if (cs.length === 1) { claim(a, cs[0], 'canon'); resto.splice(resto.indexOf(a), 1); }
  }
  for (const a of [...resto]) {                       // subsecuencia directa (DGAE ⊆ archivo)
    const cs = rfilt(a, libres().filter((e) => esSubsecuencia(a.norm, e.key)));
    if (cs.length === 1) { claim(a, cs[0], 'subsec'); resto.splice(resto.indexOf(a), 1); }
  }
  for (const a of [...resto]) {                       // fuzzy, sobre PDFs no reclamados
    const rank = rfilt(a, libres()).map((e) => ({ e, sc: dice(a.norm, e.key) })).sort((x, y) => y.sc - x.sc);
    if (rank.length && rank[0].sc >= 0.72 && (rank.length < 2 || rank[0].sc - rank[1].sc >= 0.08)) {
      claim(a, rank[0].e, 'fuzzy'); resto.splice(resto.indexOf(a), 1);
    }
  }
  return out;
}

// Fuente alterna: DGAE-SIAE da clave↔nombre (plantel Acatlán); las horas salen del
// PDF del plan de Acatlán cruzando por clave-en-archivo o por nombre.
//   - Simple (Economía, Sociología): una sola tabla de horas (folder más reciente).
//   - multigen (planes divididos, p.ej. Derecho): cada generación vigente se cruza
//     contra SU carpeta de PDF (vieja↔plan viejo, nueva↔plan nuevo) → una clave nunca
//     hereda horas de otra generación. Resuelve el riesgo "misma clave, otras horas".
async function scrapearPorDGAE(carrera, dir) {
  const { codigo, nombre, pageId, dgae, aliases = {} } = carrera;
  const pdes = Array.isArray(dgae.pde) ? dgae.pde : [dgae.pde];
  console.log(`\n=== ${nombre} (${codigo}) [DGAE plt=${dgae.plt} crr=${dgae.crr} pde=${pdes.join(',')}${dgae.multigen ? ' multigen' : ''}] ===`);

  // 1) DGAE → clave↔nombre (unión de todos los pde, dedup por clave). En multigen se
  // etiqueta cada clave con el año de su generación (para elegir carpeta de horas).
  const genPorPde = dgae.multigen ? await dgaeGenPorPde(dgae.plt, dgae.crr) : null;
  const porClave = new Map();
  for (const pde of pdes) {
    const dgUrl = `https://www.dgae-siae.unam.mx/educacion/planes.php?plt=${dgae.plt}&crr=${dgae.crr}&pde=${pde}&acc=est`;
    // DGAE sirve las páginas en ISO-8859-1; .text() (UTF-8) corrompe acentos (Ñ, Á…)
    // → normNombre los borra y el match por nombre falla. Decodificar como latin1.
    const dgHtml = new TextDecoder('iso-8859-1').decode(await (await fetch(dgUrl, { headers: { 'User-Agent': UA } })).arrayBuffer());
    const g = genPorPde ? (genPorPde.get(String(pde)) ?? 0) : 0;
    let n = 0;
    for (const m of dgHtml.matchAll(/name="asg" value="(\d+)"><\/td><td class="CellDat" align="left">([^<]+)/g)) {
      if (!porClave.has(m[1])) { porClave.set(m[1], { clave: m[1], nombre: m[2].trim(), norm: normNombre(m[2]), rset: romanSet(m[2]), gen: g }); n++; }
    }
    console.log(`  DGAE pde=${pde}: +${n} claves nuevas`);
    if (pdes.length > 1) await sleep(300);
  }
  const asignaturas = [...porClave.values()];
  console.log(`  DGAE: ${asignaturas.length} asignaturas con clave (unión de ${pdes.length} pde)`);

  // 2) Horas por carpeta. En multigen: mapear cada generación (rank viejo→nuevo) a
  // una carpeta (rank viejo→nuevo), alineando por la cola (la generación más nueva
  // con la carpeta más nueva). Simple: una única carpeta (la más reciente) para todo.
  const { plan, pdfs, carpetas } = await inventarioPlanTodas(pageId);
  const mapaPorGen = new Map();     // gen → {entradas, porClave}
  const genToFolder = new Map();
  let planLabel;
  if (dgae.multigen) {
    const gensAsc = [...new Set(asignaturas.map((a) => a.gen))].sort((x, y) => x - y);
    for (let i = 0; i < gensAsc.length; i++) {
      const fIdx = Math.min(carpetas.length - 1, Math.max(0, carpetas.length - (gensAsc.length - i)));
      genToFolder.set(gensAsc[i], carpetas[fIdx]);
    }
    console.log(`  gens→carpetas: ${[...genToFolder].map(([g, f]) => g + '→' + f).join('  ')}`);
    const cache = new Map();
    for (const f of new Set(genToFolder.values())) {
      const m = await horasDeCarpeta(f, pdfs);
      cache.set(f, m);
      console.log(`  carpeta ${f}: ${m.entradas.length} PDFs con horas (${m.porClave.size} con clave en archivo)`);
    }
    for (const [g, f] of genToFolder) mapaPorGen.set(g, cache.get(f));
    planLabel = `dgae-multigen:${pdes.join(',')}+${[...new Set(genToFolder.values())].join('+')}`;
  } else {
    // Folder más reciente para todas las claves.
    const nuevo = carpetas.at(-1);
    const m = await horasDeCarpeta(nuevo, pdfs);
    mapaPorGen.set(0, m);
    console.log(`  PDFs con horas: ${m.entradas.length} (plan ${nuevo})`);
    planLabel = `dgae:${pdes.join(',')}+${nuevo}`;
  }

  // 3) Cruce por generación (con reclamo), luego fallback cross-generación.
  const salida = { codigo, nombre, plan: planLabel, fecha_consulta: new Date().toISOString(), materias: {} };
  const resultado = new Map();      // clave → {horas, teo, pra, via}
  for (const gen of new Set(asignaturas.map((a) => a.gen))) {
    const asigs = asignaturas.filter((a) => a.gen === gen);
    for (const [k, v] of matchGen(asigs, mapaPorGen.get(gen), aliases)) resultado.set(k, v);
  }
  // Fallback cross-generación: para claves cuya carpeta NO tiene el PDF (link muerto/
  // faltante en el servidor), buscar por nombre EXACTO o canónico en TODAS las carpetas
  // vigentes. Es la misma materia y comparte horas entre planes; SOLO si las horas son
  // únicas entre carpetas (si difieren, no se adivina → cae a modo outlier del detector).
  const gByNorm = new Map(), gByCanon = new Map();
  for (const m of new Set(mapaPorGen.values())) for (const e of m.entradas) {
    (gByNorm.get(e.key) || gByNorm.set(e.key, new Map()).get(e.key)).set(e.horas, e);
    (gByCanon.get(e.canon) || gByCanon.set(e.canon, new Map()).get(e.canon)).set(e.horas, e);
  }
  let crossgen = 0;
  for (const a of asignaturas) {
    if (resultado.has(a.clave)) continue;
    let hit = gByNorm.get(a.norm);
    if ((!hit || hit.size !== 1) && canonAbrev(a.norm) !== a.norm) hit = gByCanon.get(canonAbrev(a.norm));
    if (hit && hit.size === 1) { const e = [...hit.values()][0]; resultado.set(a.clave, { horas: e.horas, teo: e.teo, pra: e.pra, via: 'crossgen' }); crossgen++; }
  }
  // Equivalencias curadas (materias renombradas entre planes): la clave vieja del
  // horario hereda las horas de la clave nueva ya emparejada. Solo pares verificados.
  for (const [src, spec] of Object.entries(EQUIVALENCIAS[codigo] || {})) {
    const tgt = typeof spec === 'string' ? spec : spec.tgt;
    if (resultado.has(src) || !resultado.has(tgt)) continue;
    const t = resultado.get(tgt);
    resultado.set(src, { horas: t.horas, teo: t.teo, pra: t.pra, via: 'equivalencia' });
  }
  const via = { clave: 0, alias: 0, exacto: 0, canon: 0, subsec: 0, fuzzy: 0, crossgen: 0, equivalencia: 0 };
  const sinMatch = [];
  for (const a of asignaturas) {
    const r = resultado.get(a.clave);
    if (r) { salida.materias[a.clave] = { nombre: a.nombre, horas_semana: r.horas, teoricas_semana: r.teo, practicas_semana: r.pra }; via[r.via]++; }
    else sinMatch.push(a);
  }
  const ok = resultado.size;
  console.log(`  match: ${Object.entries(via).filter(([, c]) => c).map(([k, c]) => k + '=' + c).join(' ') || '—'}`);
  fs.writeFileSync(path.join(dir, `${codigo}.json`), JSON.stringify(salida, null, 2));
  console.log(`  → data/planes/${codigo}.json — ${ok}/${asignaturas.length} materias [DGAE${dgae.multigen ? '/multigen' : ''}] (${plan})`);
  if (sinMatch.length) {
    const porGen = {};
    for (const a of sinMatch) porGen[a.gen] = (porGen[a.gen] || 0) + 1;
    console.log(`  ⚠️ ${sinMatch.length} sin match (por gen: ${Object.entries(porGen).map(([g, c]) => g + ':' + c).join(' ')}):`);
    for (const a of sinMatch.slice(0, 15)) console.log(`      [${a.gen}] ${a.clave}  "${a.nombre}"`);
    if (sinMatch.length > 15) console.log(`      … +${sinMatch.length - 15} más`);
  }
  return { codigo, nombre, ok, fail: sinMatch.length, plan: salida.plan, total: asignaturas.length, fuentes: { dgae: ok }, sinClaveConHoras: [], sinHoras: [] };
}

async function scrapearCarrera(carrera, dir) {
  if (carrera.endpoint) return scrapearPorEndpoint(carrera, dir);
  if (carrera.dgae) return scrapearPorDGAE(carrera, dir);
  const { codigo, nombre, pageId } = carrera;
  console.log(`\n=== ${nombre} (${codigo}, id=${pageId}) ===`);
  // Carga TODAS las carpetas de plan (viejo+nuevo): en el horario conviven alumnos
  // de varias generaciones y cada clave saca sus horas de su propio PDF.
  const { plan, pdfs, carpetas } = await inventarioPlanTodas(pageId);
  if (!plan) {
    console.warn(`  ⚠️ sin PDFs de plan en la página; se omite.`);
    return { codigo, nombre, ok: 0, fail: 0, plan: null };
  }
  console.log(`  Planes (${carpetas.length}): ${carpetas.join(', ')} — ${pdfs.length} PDFs`);

  const salida = { codigo, nombre, plan, fecha_consulta: new Date().toISOString(), materias: {} };
  let ok = 0, fail = 0;
  const fuentes = {};                 // conteo de claves por fuente (label/vertical/inline/archivo…)
  const sinClaveConHoras = [];        // horas OK pero clave no detectada (candidatas a otra fuente)
  const sinHoras = [];                // ni horas
  for (const rel of pdfs) {
    const url = encodeURI(`${BASE}files/PlanesDeEstudio/${rel}`); // codifica espacios en el nombre
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = Buffer.from(await resp.arrayBuffer());
      const { text } = await new PDFParse({ data: buf }).getText();
      const info = parsearPrograma(text || '', rel);
      if (info.horas_semana == null) sinHoras.push(rel);
      if (!info.clave || info.horas_semana == null) {
        fail++;
        if (info.horas_semana != null && !info.clave) sinClaveConHoras.push(rel);
      } else {
        fuentes[info.claveFuente] = (fuentes[info.claveFuente] || 0) + 1;
        salida.materias[info.clave] = {
          nombre: decodeURIComponent(rel.split('/').pop().replace(/\.pdf$/, '')).replace(/[-_]/g, ' '),
          semestre: info.semestre,
          horas_semana: info.horas_semana,
          teoricas_semana: info.teoricas_semana,
          practicas_semana: info.practicas_semana,
        };
        ok++;
      }
      await sleep(300);
    } catch (e) {
      console.warn(`  ✗ ${rel}: ${e.message}`);
      fail++;
    }
  }

  const nEquiv = aplicarEquivalencias(salida.materias, codigo);
  if (nEquiv) { ok += nEquiv; console.log(`  equivalencias curadas aplicadas: ${nEquiv}`); }
  fs.writeFileSync(path.join(dir, `${codigo}.json`), JSON.stringify(salida, null, 2));
  const fuentesStr = Object.entries(fuentes).map(([k, v]) => `${k}:${v}`).join(' ') || '—';
  console.log(`  → data/planes/${codigo}.json — ${ok} materias · fuentes[${fuentesStr}] · ${sinClaveConHoras.length} sin-clave · ${sinHoras.length} sin-horas`);
  return { codigo, nombre, ok, fail, plan, total: pdfs.length, fuentes, sinClaveConHoras, sinHoras };
}

async function main() {
  const soloCodigo = process.argv[2];
  const lista = soloCodigo ? CARRERAS.filter((c) => c.codigo === soloCodigo) : CARRERAS;
  if (lista.length === 0) {
    console.error(`Código ${soloCodigo} no está en la tabla de carreras.`);
    process.exit(1);
  }
  const dir = path.join(dataDir, 'planes');
  fs.mkdirSync(dir, { recursive: true });

  const resumen = [];
  for (const carrera of lista) resumen.push(await scrapearCarrera(carrera, dir));

  console.log(`\n===== RESUMEN (cobertura de clave) =====`);
  for (const r of resumen) {
    const cobertura = r.total ? Math.round((r.ok / r.total) * 100) : 0;
    const fuentesStr = Object.entries(r.fuentes || {}).map(([k, v]) => `${k}:${v}`).join(' ') || '—';
    console.log(`  ${String(cobertura).padStart(3)}%  ${r.ok.toString().padStart(3)}/${String(r.total || 0).padEnd(3)}  ${r.nombre.padEnd(38)} [${fuentesStr}]`);
  }

  // Carreras con inconsistencia interna: algunas materias con clave, otras sin (mismo plan).
  console.log(`\n===== INCONSISTENCIAS (clave presente en unas materias, ausente en otras) =====`);
  const inconsistentes = resumen.filter((r) => r.ok > 0 && (r.sinClaveConHoras || []).length > 0);
  if (inconsistentes.length === 0) console.log('  (ninguna — dentro de cada carrera la clave es o siempre o nunca detectable)');
  for (const r of inconsistentes) {
    console.log(`  ${r.nombre}: ${r.sinClaveConHoras.length} materias con horas pero SIN clave detectada:`);
    for (const rel of r.sinClaveConHoras.slice(0, 8)) console.log(`      · ${rel}`);
    if (r.sinClaveConHoras.length > 8) console.log(`      … +${r.sinClaveConHoras.length - 8} más`);
  }

  // Carreras que quedan totalmente sin clave (candidatas a buscar otra fuente).
  const sinNada = resumen.filter((r) => r.plan && r.ok === 0);
  if (sinNada.length) {
    console.log(`\n===== CARRERAS SIN NINGUNA CLAVE (revisar fuente alterna) =====`);
    for (const r of sinNada) console.log(`  ${r.nombre} — ${r.total} PDFs, 0 con clave`);
  }

  const totalOk = resumen.reduce((a, r) => a + r.ok, 0);
  console.log(`\n  TOTAL: ${totalOk} materias con clave+horas en ${resumen.filter((r) => r.ok > 0).length}/${lista.length} carreras.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

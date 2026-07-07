// Detector de errores de carga de horarios.
// Compara horas/semana del horario (por grupo) contra el plan de estudios.
//  B (principal): si hay clave en el plan → esperado = plan.horas_semana.
//  A (fallback):  si NO hay plan → moda de las horas entre grupos (cualquier # de grupos);
//                 solo se marca a una MINORÍA que se aparta (con 1 grupo o empate no marca).
// Salida: data/anomalias/<codigo>.json (no toca data/carreras, no altera hashes).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const horasGrupo = (g) => (g.horarios || []).reduce((a, h) => a + (toMin(h.fin) - toMin(h.inicio)), 0) / 60;

function moda(nums) {
  const c = {};
  for (const n of nums) c[n] = (c[n] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]; // [valorStr, conteo]
}

// Fallback curado de horas para optativas sin plan, POR CARRERA. En Actuaría todas las
// optativas (bolsa de libre elección, semestre "40" en el horario) son de 4 h/semana —
// validado: las 11 optativas con plan y sus grupos son exactamente 4h. Una optativa sin
// plan (p.ej. 2055 Series de Tiempo, cuyo PDF no expone el endpoint) hereda ese 4h como
// esperado, para poder juzgarla igual que las demás en vez de quedar sin cubrir.
const OPTATIVA_FALLBACK = {
  '20321': { semestre: '40', horas: 4 }, // Actuaría: optativas = 4h
};

export function detectar(codigo) {
  const horarioPath = path.join(dataDir, 'carreras', `${codigo}.json`);
  const planPath = path.join(dataDir, 'planes', `${codigo}.json`);
  const horario = readJson(horarioPath);
  const plan = fs.existsSync(planPath) ? readJson(planPath).materias : {};

  const fallback = OPTATIVA_FALLBACK[codigo];
  const anomalias = {};
  for (const [clave, materia] of Object.entries(horario.materias || {})) {
    const grupos = (materia.grupos || []).map((g) => ({ grupo: g.grupo, horas: horasGrupo(g) }));
    if (grupos.length === 0) continue;

    const esperadoPlan = plan[clave]?.horas_semana;
    let esperado, fuente;

    if (esperadoPlan != null) {
      esperado = esperadoPlan;            // B: fuente de verdad
      fuente = 'plan';
    } else if (fallback && materia.semestre === fallback.semestre) {
      esperado = fallback.horas;          // Fallback curado por carrera (Actuaría: optativas 4h)
      fuente = 'optativa-fija';
    } else {
      // A: fallback de la MAYORÍA (moda de los grupos) para toda materia sin plan. La
      // regla de minoría de más abajo mantiene la seguridad aunque haya pocos grupos:
      // con 1 grupo (o empate en 2) nunca se marca nada, así que jamás hay falso positivo;
      // solo cuando una minoría clara se aparta de la mayoría se levanta la alerta.
      const [val] = moda(grupos.map((g) => g.horas));
      esperado = Number(val);
      fuente = 'outlier';
    }

    const afectados = grupos.filter((g) => g.horas !== esperado);
    if (afectados.length === 0) continue;
    // Solo alertar si los afectados son MINORÍA (la mayoría de los grupos SÍ cumple
    // el esperado). Vale para ambas fuentes:
    //  - outlier: la moda ya es el esperado por construcción.
    //  - plan: si TODOS (o casi) los grupos difieren del plan, no es un error de carga
    //    sino que el plan cuenta las horas distinto (p.ej. incluye laboratorio en Ing.
    //    Civil: plan 6h = T2/P4, pero la clase se reúne 4h). Evita falsos positivos.
    const conformes = grupos.length - afectados.length;
    if (afectados.length >= conformes) continue;

    anomalias[clave] = {
      nombre: materia.nombre,
      esperado_horas_semana: esperado,
      fuente,
      // El mensaje se genera por grupo (fuente única de verdad): la UI muestra un badge
      // por grupo afectado y consume este texto tal cual, sin reconstruirlo en el cliente.
      grupos_afectados: afectados.map((g) => ({
        grupo: g.grupo,
        horas_semana: g.horas,
        mensaje: `Posible error. Este grupo marca ${g.horas} h a la semana cuando deberían ser ${esperado}. Verifícalo antes de inscribirte.`,
      })),
    };
  }
  return anomalias;
}

function procesar(codigo, dir) {
  const anomalias = detectar(codigo);
  const out = { codigo, fecha: new Date().toISOString(), total: Object.keys(anomalias).length, materias: anomalias };
  fs.writeFileSync(path.join(dir, `${codigo}.json`), JSON.stringify(out, null, 2));
  console.log(`Carrera ${codigo}: ${out.total} materias con anomalías → data/anomalias/${codigo}.json`);
  for (const [c, a] of Object.entries(anomalias)) {
    console.log(`  ⚠️ ${c} ${a.nombre} [${a.fuente}] esperado ${a.esperado_horas_semana}h, grupos: ${a.grupos_afectados.map((g) => g.grupo + '=' + g.horas_semana + 'h').join(', ')}`);
  }
  return out.total;
}

// CLI: `node detectar-anomalias.mjs` → todas las carreras (index.json)
//      `node detectar-anomalias.mjs 20721` → solo una
if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = path.join(dataDir, 'anomalias');
  fs.mkdirSync(dir, { recursive: true });
  const arg = process.argv[2];
  let codigos;
  if (arg) {
    codigos = [arg];
  } else {
    const index = readJson(path.join(dataDir, 'index.json'));
    codigos = Object.keys(index.carreras || {});
  }
  let totalMaterias = 0;
  for (const codigo of codigos) {
    const horarioPath = path.join(dataDir, 'carreras', `${codigo}.json`);
    if (!fs.existsSync(horarioPath)) { console.warn(`(sin horario) ${codigo}`); continue; }
    totalMaterias += procesar(codigo, dir);
  }
  console.log(`\nTOTAL: ${totalMaterias} materias con anomalías en ${codigos.length} carreras.`);
}

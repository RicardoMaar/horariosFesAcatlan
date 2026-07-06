// Detector de errores de carga de horarios.
// Compara horas/semana del horario (por grupo) contra el plan de estudios.
//  B (principal): si hay clave en el plan → esperado = plan.horas_semana.
//  A (fallback):  si NO hay plan → moda de las horas entre grupos; outliers se marcan.
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

export function detectar(codigo) {
  const horarioPath = path.join(dataDir, 'carreras', `${codigo}.json`);
  const planPath = path.join(dataDir, 'planes', `${codigo}.json`);
  const horario = readJson(horarioPath);
  const plan = fs.existsSync(planPath) ? readJson(planPath).materias : {};

  const anomalias = {};
  for (const [clave, materia] of Object.entries(horario.materias || {})) {
    const grupos = (materia.grupos || []).map((g) => ({ grupo: g.grupo, horas: horasGrupo(g) }));
    if (grupos.length === 0) continue;

    const esperadoPlan = plan[clave]?.horas_semana;
    let esperado, fuente;

    if (esperadoPlan != null) {
      esperado = esperadoPlan;            // B: fuente de verdad
      fuente = 'plan';
    } else if (grupos.length >= 3) {
      const [val] = moda(grupos.map((g) => g.horas)); // A: fallback outlier
      esperado = Number(val);
      fuente = 'outlier';
    } else {
      continue; // sin plan y muy pocos grupos → no se puede juzgar
    }

    const afectados = grupos.filter((g) => g.horas !== esperado);
    if (afectados.length === 0) continue;
    // En modo outlier, solo alertar si los afectados son minoría (si la mayoría difiere, la "moda" ya es el esperado)
    if (fuente === 'outlier' && afectados.length >= grupos.length - afectados.length) continue;

    anomalias[clave] = {
      nombre: materia.nombre,
      esperado_horas_semana: esperado,
      fuente,
      grupos_afectados: afectados.map((g) => ({ grupo: g.grupo, horas_semana: g.horas })),
      mensaje: `Posible error. ${afectados.length === 1 ? 'Este grupo marca' : 'Estos grupos marcan'} ${afectados.map((g) => g.horas).join('/')} h a la semana cuando deberían ser ${esperado}. Verifícalo antes de inscribirte.`,
    };
  }
  return anomalias;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const codigo = process.argv[2] || '20721';
  const anomalias = detectar(codigo);
  const dir = path.join(dataDir, 'anomalias');
  fs.mkdirSync(dir, { recursive: true });
  const out = { codigo, fecha: new Date().toISOString(), total: Object.keys(anomalias).length, materias: anomalias };
  fs.writeFileSync(path.join(dir, `${codigo}.json`), JSON.stringify(out, null, 2));
  console.log(`Carrera ${codigo}: ${out.total} materias con anomalías → data/anomalias/${codigo}.json`);
  for (const [c, a] of Object.entries(anomalias)) {
    console.log(`  ⚠️ ${c} ${a.nombre} [${a.fuente}] esperado ${a.esperado_horas_semana}h, grupos: ${a.grupos_afectados.map((g) => g.grupo + '=' + g.horas_semana + 'h').join(', ')}`);
  }
}

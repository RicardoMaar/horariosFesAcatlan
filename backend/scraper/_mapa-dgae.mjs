// Enumera TODAS las carreras de FES Acatlán en DGAE-SIAE (planteles → carreras) y
// escribe un CSV con su link `acc=pde` (lista de planes con vigencia/generación).
// Uso: node _mapa-dgae.mjs   → escribe mapa-dgae-acatlan.csv
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0';
const BASE = 'https://www.dgae-siae.unam.mx/educacion/';
const dec = (b) => new TextDecoder('iso-8859-1').decode(b);
const get = async (u) => dec(await (await fetch(BASE + u, { headers: { 'User-Agent': UA } })).arrayBuffer());

// código interno del proyecto por (plt,crr); '' = carrera no rastreada aún.
const CODIGO = {
  '0201/102': '20121', '0202/406': '20226', '0203/101': '20321',
  '0204/303': '20422', '0204/310': '20421', '0204/311': '20423', '0204/315': '20425',
  '0207/305': '20721', '0208/306': '20821',
  '0210/411': '21011', '0210/412': '21021', '0210/414': '21013', '0210/421': '21025',
  '0211/107': '21121', '0240/121': '24022', '0241/408': '24121',
};

const csvCell = (s) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

async function main() {
  // 1) planteles de Acatlán
  const pltHtml = await get('planteles.php');
  const planteles = [...pltHtml.matchAll(/name="plt" value="(\d+)"[^>]*><\/td><td class="CellDat"[^>]*>([^<]*)/g)]
    .map((m) => ({ plt: m[1], nombre: m[2].replace(/\s+/g, ' ').trim() }))
    .filter((p) => /ACATLAN/i.test(p.nombre));

  // 2) carreras por plantel
  const filas = [];
  for (const { plt, nombre } of planteles) {
    const division = (nombre.match(/\(([^)]+)\)/) || [])[1] || '';
    const html = await get(`carreras.php?plt=${plt}`);
    for (const m of html.matchAll(/name="crr" value="(\d+)"[^>]*><\/td><td class="CellDat"[^>]*>([^<]*)/g)) {
      const crr = m[1], carrera = m[2].replace(/\s+/g, ' ').trim();
      filas.push({
        codigo: CODIGO[`${plt}/${crr}`] || '',
        carrera, division, plt, crr,
        link_acc_pde: `${BASE}planes.php?plt=${plt}&crr=${crr}&acc=pde`,
      });
    }
  }

  // 3) CSV
  const cols = ['codigo', 'carrera', 'division', 'plt', 'crr', 'link_acc_pde'];
  const lines = [cols.join(',')];
  for (const f of filas) lines.push(cols.map((c) => csvCell(String(f[c]))).join(','));
  const outPath = path.join(__dirname, 'mapa-dgae-acatlan.csv');
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
  console.log(`${filas.length} carreras → ${outPath}`);
}

main();

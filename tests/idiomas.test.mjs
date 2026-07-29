import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const idiomasDir = path.join(process.cwd(), 'data', 'idiomas');
const indexPath = path.join(idiomasDir, 'index.json');
const metadataPath = path.join(idiomasDir, 'metadata.json');

const hashContent = (content) => crypto.createHash('sha256').update(content).digest('hex');
const hashIdioma = (data) => {
  const comparable = { ...data };
  delete comparable.fecha_consulta;
  return hashContent(JSON.stringify(comparable));
};
const timeRegex = /^\d{2}:\d{2}$/;
const days = new Set(['LU', 'MA', 'MI', 'JU', 'VI']);

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

test('índice y metadata de idiomas son consistentes', () => {
  assert.ok(fs.existsSync(indexPath), 'Falta data/idiomas/index.json');
  assert.ok(fs.existsSync(metadataPath), 'Falta data/idiomas/metadata.json');

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  assert.equal(index.periodo, '2027-1');
  assert.ok(index.total_idiomas >= 6);
  assert.equal(Object.keys(index.idiomas).length, index.total_idiomas);
  assert.deepEqual(Object.keys(metadata.idiomas).sort(), Object.keys(index.idiomas).sort());
});

test('cada idioma tiene grupos válidos y hash consistente', () => {
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  let totalGroups = 0;

  for (const idioma of Object.values(index.idiomas)) {
    const filePath = path.join(idiomasDir, `${idioma.slug}.json`);
    assert.ok(fs.existsSync(filePath), `Falta el archivo de ${idioma.nombre}`);

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const meta = metadata.idiomas[idioma.codigo];

    assert.equal(data.codigo, idioma.codigo);
    assert.equal(data.slug, idioma.slug);
    assert.equal(data.periodo, index.periodo);
    assert.equal(data.grupos.length, idioma.total_grupos);
    assert.equal(hashIdioma(data), meta.hash);
    assert.ok(data.grupos.length > 0, `${idioma.nombre} no tiene grupos`);

    for (const grupo of data.grupos) {
      assert.ok(grupo.grupo, `Grupo sin identificador en ${idioma.nombre}`);
      // Babel deja vacío el profesor en algunos grupos todavía no asignados.
      assert.equal(typeof grupo.profesor, 'string');
      assert.ok(grupo.horarios.length > 0, `Grupo sin horario: ${grupo.grupo}`);

      for (const horario of grupo.horarios) {
        assert.ok(days.has(horario.dia), `Día inválido en ${grupo.grupo}`);
        assert.ok(timeRegex.test(horario.inicio), `Hora inicial inválida en ${grupo.grupo}`);
        assert.ok(timeRegex.test(horario.fin), `Hora final inválida en ${grupo.grupo}`);
        assert.ok(
          toMinutes(horario.inicio) < toMinutes(horario.fin),
          `Horario invertido en ${grupo.grupo}`
        );
      }
    }

    totalGroups += data.grupos.length;
  }

  assert.ok(totalGroups >= 111);
});

test('el grupo de referencia de Babel conserva profesor y días', () => {
  const data = JSON.parse(fs.readFileSync(path.join(idiomasDir, 'aleman.json'), 'utf8'));
  const group = data.grupos.find((item) => item.grupo === 'CL01_13AP01');

  assert.ok(group, 'No se encontró el grupo CL01_13AP01');
  assert.equal(group.profesor, 'CARLOS GERARDO CABRERA LERMA');
  assert.deepEqual(group.horarios.map((item) => item.dia), ['LU', 'MI']);
  assert.deepEqual(group.horarios.map((item) => [item.inicio, item.fin]), [
    ['13:00', '15:00'],
    ['13:00', '15:00']
  ]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dataDir = path.join(process.cwd(), 'data');
const carrerasDir = path.join(dataDir, 'carreras');

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return { raw, data: JSON.parse(raw) };
};

const hashContent = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const timeRegex = /^\d{2}:\d{2}$/;
const diasValidos = new Set(['LU', 'MA', 'MI', 'JU', 'VI', 'SA']);

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

test('data/index.json y data/metadata.json existen y son consistentes', () => {
  const indexPath = path.join(dataDir, 'index.json');
  const metadataPath = path.join(dataDir, 'metadata.json');

  assert.ok(fs.existsSync(indexPath), 'Falta data/index.json');
  assert.ok(fs.existsSync(metadataPath), 'Falta data/metadata.json');

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  assert.ok(index.carreras && typeof index.carreras === 'object', 'index.carreras invalido');
  assert.ok(metadata.carreras && typeof metadata.carreras === 'object', 'metadata.carreras invalido');
  assert.equal(
    Object.keys(index.carreras).length,
    index.total_carreras,
    'index.total_carreras no coincide con el conteo'
  );
  assert.equal(
    Object.keys(metadata.carreras).length,
    index.total_carreras,
    'metadata.carreras no coincide con index.total_carreras'
  );
  assert.ok(Array.isArray(metadata.carreras_faltantes), 'metadata.carreras_faltantes invalido');
  assert.equal(
    metadata.carreras_faltantes.length,
    0,
    'Hay carreras faltantes en metadata'
  );
});

test('cada carrera tiene archivo, hash consistente y horarios validos', () => {
  const indexPath = path.join(dataDir, 'index.json');
  const metadataPath = path.join(dataDir, 'metadata.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  let gruposSinHorario = 0;

  for (const [codigo, carrera] of Object.entries(index.carreras)) {
    const carreraPath = path.join(carrerasDir, `${codigo}.json`);
    assert.ok(fs.existsSync(carreraPath), `Falta archivo de carrera ${codigo}`);

    const { raw, data } = readJson(carreraPath);
    assert.equal(data.codigo, codigo, `Codigo incorrecto en ${codigo}.json`);
    assert.equal(data.nombre, carrera.nombre, `Nombre incorrecto en ${codigo}.json`);

    const meta = metadata.carreras[codigo];
    assert.ok(meta && meta.hash, `Falta metadata para ${codigo}`);

    const computedHash = hashContent(raw);
    assert.equal(computedHash, meta.hash, `Hash incorrecto en ${codigo}`);

    for (const [clave, materia] of Object.entries(data.materias || {})) {
      assert.ok(Array.isArray(materia.grupos) && materia.grupos.length > 0, `Materia ${clave} sin grupos`);

      const gruposConHorario = materia.grupos.filter(
        (grupo) => Array.isArray(grupo.horarios) && grupo.horarios.length > 0
      );
      gruposSinHorario += materia.grupos.length - gruposConHorario.length;
      assert.ok(gruposConHorario.length > 0, `Materia ${clave} sin horario en ningun grupo`);

      for (const grupo of gruposConHorario) {
        for (const horario of grupo.horarios) {
          assert.ok(diasValidos.has(horario.dia), `Dia invalido en ${clave}`);
          assert.ok(timeRegex.test(horario.inicio), `Hora inicio invalida en ${clave}`);
          assert.ok(timeRegex.test(horario.fin), `Hora fin invalida en ${clave}`);
          assert.ok(
            toMinutes(horario.inicio) < toMinutes(horario.fin),
            `Horario invertido en ${clave}`
          );
        }
      }
    }
  }

  if (gruposSinHorario > 0) {
    console.warn(`Aviso: ${gruposSinHorario} grupos sin horario fueron detectados.`);
  }
});

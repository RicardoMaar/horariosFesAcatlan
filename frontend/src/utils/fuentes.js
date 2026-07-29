export const MAX_CARRERAS = 2;
export const MAX_IDIOMAS = 3;

export const crearFuenteId = (tipo, codigo) => `${tipo}:${codigo}`;

export const getSelectionId = (materia, grupo) => {
  const fuenteId = grupo?.fuenteId || materia?.fuenteId;
  const clave = materia?.clave || grupo?.clave || '';
  const grupoId = grupo?.grupo || '';
  return fuenteId ? `${fuenteId}:${clave}-${grupoId}` : `${clave}-${grupoId}`;
};

const agregarFuente = (materia, grupo, fuente) => ({
  ...grupo,
  fuenteId: fuente.id,
  fuenteTipo: fuente.tipo,
  fuenteNombre: fuente.nombre
});

export const normalizarCarrera = (data, fuente) => {
  const materias = data?.materias || {};
  return Object.fromEntries(
    Object.entries(materias).map(([clave, materia]) => [
      clave,
      {
        ...materia,
        clave,
        fuenteId: fuente.id,
        fuenteTipo: fuente.tipo,
        fuenteNombre: fuente.nombre,
        grupos: (materia.grupos || []).map((grupo) => agregarFuente(materia, grupo, fuente))
      }
    ])
  );
};

export const normalizarIdioma = (data, fuente) => {
  const materias = {};

  for (const grupo of data?.grupos || []) {
    const tipo = grupo.tipo_curso || 'Curso';
    const nivel = grupo.nivel || 'Nivel';
    const clave = `${grupo.tipo_curso_codigo || 'curso'}-${grupo.nivel_codigo || nivel}`;

    if (!materias[clave]) {
      materias[clave] = {
        clave,
        nombre: `${tipo} · ${nivel}`,
        semestre: 'IDIOMA',
        fuenteId: fuente.id,
        fuenteTipo: fuente.tipo,
        fuenteNombre: fuente.nombre,
        grupos: []
      };
    }

    materias[clave].grupos.push({
      ...grupo,
      clave,
      fuenteId: fuente.id,
      fuenteTipo: fuente.tipo,
      fuenteNombre: fuente.nombre
    });
  }

  return materias;
};

export const construirFuenteCarrera = (codigo, carrera) => ({
  id: crearFuenteId('carrera', codigo),
  tipo: 'carrera',
  codigo,
  nombre: carrera?.nombre || codigo,
  etiqueta: 'Carrera'
});

export const construirFuenteIdioma = (idioma) => ({
  id: crearFuenteId('idioma', idioma.slug),
  tipo: 'idioma',
  codigo: idioma.slug,
  nombre: idioma.nombre,
  etiqueta: 'Idioma',
  grupos: idioma.total_grupos
});

export const contarFuentes = (fuentes, tipo) => fuentes.filter((fuente) => fuente.tipo === tipo).length;

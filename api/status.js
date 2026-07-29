const { getIndex, getIdiomasIndex } = require('./_lib/data');
const { sendJson } = require('./_lib/http');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  const index = getIndex();
  if (!index) {
    return sendJson(res, 503, { error: 'Datos no disponibles' });
  }

  const idiomas = getIdiomasIndex();

  return sendJson(
    res,
    200,
    {
      status: 'ok',
      fecha_actualizacion: index.fecha_actualizacion,
      total_carreras: index.total_carreras,
      fecha_idiomas: idiomas?.fecha_actualizacion || null,
      periodo_idiomas: idiomas?.periodo || null,
      total_idiomas: idiomas?.total_idiomas || 0
    },
    {
      'Cache-Control': 'no-cache'
    }
  );
};

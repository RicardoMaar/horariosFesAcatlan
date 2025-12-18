const { getIndex } = require('./_lib/data');
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

  return sendJson(res, 200, index.carreras || {}, {
    'Cache-Control': 'public, max-age=60'
  });
};

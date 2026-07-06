const { URL } = require('url');
const { getAnomalias } = require('./_lib/data');
const { sendJson } = require('./_lib/http');

const getCodigoFromRequest = (req) => {
  if (req.query && req.query.codigo) {
    return String(req.query.codigo);
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const fromQuery = url.searchParams.get('codigo');
  if (fromQuery) {
    return fromQuery;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
};

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  const codigo = getCodigoFromRequest(req);
  if (!codigo || codigo === 'anomalias') {
    return sendJson(res, 400, { error: 'Codigo de carrera requerido' });
  }

  // Ausencia de archivo = carrera sin anomalias detectadas: respuesta vacia valida.
  const anomalias = getAnomalias(codigo) || { codigo, total: 0, materias: {} };

  res.setHeader('Cache-Control', 'public, max-age=10');
  return sendJson(res, 200, anomalias);
};

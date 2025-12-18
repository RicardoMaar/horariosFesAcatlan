const { URL } = require('url');
const { getCarrera, getMetadata } = require('./_lib/data');
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
  if (!codigo || codigo === 'horarios') {
    return sendJson(res, 400, { error: 'Codigo de carrera requerido' });
  }

  const carrera = getCarrera(codigo);
  if (!carrera) {
    return sendJson(res, 404, { error: `Carrera ${codigo} no encontrada` });
  }

  const metadata = getMetadata();
  const carreraMeta = metadata?.carreras?.[codigo];
  const etag = carreraMeta?.hash ? `"${codigo}-${carreraMeta.hash}"` : null;

  if (etag && req.headers['if-none-match'] === etag) {
    res.statusCode = 304;
    res.end();
    return;
  }

  if (etag) {
    res.setHeader('ETag', etag);
  }

  if (carreraMeta?.last_changed) {
    const lastChanged = new Date(carreraMeta.last_changed);
    if (!Number.isNaN(lastChanged.getTime())) {
      res.setHeader('Last-Modified', lastChanged.toUTCString());
    }
  }

  res.setHeader('Cache-Control', 'public, max-age=10');
  return sendJson(res, 200, carrera);
};

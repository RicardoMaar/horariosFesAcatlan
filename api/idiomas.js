const { URL } = require('url');
const { getIdioma, getIdiomasIndex, getIdiomasMetadata } = require('./_lib/data');
const { sendJson } = require('./_lib/http');

const getSlugFromRequest = (req) => {
  if (req.query && req.query.slug) return String(req.query.slug);

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const fromQuery = url.searchParams.get('slug');
  if (fromQuery) return fromQuery;

  const parts = url.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  return last && last !== 'idiomas' ? last : null;
};
module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Metodo no permitido' });
  }

  const index = getIdiomasIndex();
  if (!index) return sendJson(res, 503, { error: 'Datos de idiomas no disponibles' });

  const slug = getSlugFromRequest(req);
  if (!slug) {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return sendJson(res, 200, index);
  }

  const idioma = getIdioma(slug);
  if (!idioma) return sendJson(res, 404, { error: `Idioma ${slug} no encontrado` });

  const metadata = getIdiomasMetadata();
  const meta = Object.values(metadata?.idiomas || {}).find((item) => item.slug === slug);
  const etag = meta?.hash ? `"idioma-${slug}-${meta.hash}"` : null;

  if (etag && req.headers['if-none-match'] === etag) {
    res.statusCode = 304;
    res.end();
    return;
  }

  if (etag) res.setHeader('ETag', etag);
  if (meta?.last_changed) {
    const lastChanged = new Date(meta.last_changed);
    if (!Number.isNaN(lastChanged.getTime())) res.setHeader('Last-Modified', lastChanged.toUTCString());
  }

  res.setHeader('Cache-Control', 'public, max-age=10');
  return sendJson(res, 200, idioma);
};

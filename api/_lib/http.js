const sendJson = (res, statusCode, payload, headers = {}) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(JSON.stringify(payload));
};

module.exports = { sendJson };

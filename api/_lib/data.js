const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const cache = new Map();

const readJson = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const cached = cache.get(filePath);
    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.data;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    cache.set(filePath, { mtimeMs: stats.mtimeMs, data });
    return data;
  } catch (error) {
    return null;
  }
};

const getIndex = () => readJson(path.join(dataDir, 'index.json'));
const getMetadata = () => readJson(path.join(dataDir, 'metadata.json'));
const getCarrera = (codigo) => readJson(path.join(dataDir, 'carreras', `${codigo}.json`));

module.exports = {
  dataDir,
  getIndex,
  getMetadata,
  getCarrera
};

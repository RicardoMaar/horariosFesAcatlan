// Scraper de horarios públicos del Centro de Enseñanza de Idiomas (Babel).
//
// Babel es ASP.NET WebForms con RadComboBox de Telerik. Cada filtro dispara
// un __doPostBack y el servidor espera que conservemos el estado de la página
// (__VIEWSTATE, __EVENTVALIDATION y las cookies de sesión).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const endpoint = 'https://sistemas.acatlan.unam.mx/babel/GruposAbiertos.aspx';
const userAgent = 'Mozilla/5.0 (compatible; HorariosFesAcatlan/1.0; +https://github.com/RicardoMaar/horariosFesAcatlan)';
const defaultDelayMs = Number(process.env.BABEL_DELAY_MS || 250);

const CONTROLS = {
  idioma: {
    id: 'ctl00_ContentPlaceHolder1_cmbIdioma',
    uniqueId: 'ctl00$ContentPlaceHolder1$cmbIdioma'
  },
  tipoCurso: {
    id: 'ctl00_ContentPlaceHolder1_cmbTipoCurso',
    uniqueId: 'ctl00$ContentPlaceHolder1$cmbTipoCurso'
  },
  nivel: {
    id: 'ctl00_ContentPlaceHolder1_cmbNivel',
    uniqueId: 'ctl00$ContentPlaceHolder1$cmbNivel'
  },
  modalidad: {
    id: 'ctl00_ContentPlaceHolder1_cmbModalidadGrupo',
    uniqueId: 'ctl00$ContentPlaceHolder1$cmbModalidadGrupo'
  }
};

const DAYS = [
  { key: 'LU', label: 'Lunes' },
  { key: 'MA', label: 'Martes' },
  { key: 'MI', label: 'Miércoles' },
  { key: 'JU', label: 'Jueves' },
  { key: 'VI', label: 'Viernes' }
];

const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const slugify = (value) => normalize(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const hashContent = (content) => crypto.createHash('sha256').update(content).digest('hex');

const hashIdioma = (idioma) => {
  const comparable = { ...idioma };
  delete comparable.fecha_consulta;
  return hashContent(JSON.stringify(comparable));
};

const readJsonFile = (filePath, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJsonFile = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, json, 'utf8');
  return json;
};

const getSetCookies = (headers) => {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  const cookie = headers.get('set-cookie');
  return cookie ? [cookie] : [];
};

const updateCookieJar = (jar, headers) => {
  for (const header of getSetCookies(headers)) {
    const pair = header.split(';', 1)[0];
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    jar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
};

const formFieldsFromDocument = (document) => {
  const form = document.querySelector('form') || document;
  const fields = new URLSearchParams();

  for (const input of form.querySelectorAll('input[name]')) {
    if (input.disabled || input.type === 'submit' || input.type === 'button') continue;
    fields.set(input.name, input.value || '');
  }

  return fields;
};

const getClientState = (document, control) => {
  const input = document.getElementById(`${control.id}_ClientState`);
  if (!input?.value) return {};
  try {
    return JSON.parse(input.value);
  } catch {
    return {};
  }
};

const parseItemData = (document, control) => {
  const marker = `"_uniqueId":"${control.uniqueId}"`;
  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent || '';
    const markerIndex = text.indexOf(marker);
    if (markerIndex === -1) continue;

    const rest = text.slice(markerIndex);
    const match = rest.match(/"itemData":(\[[\s\S]*?\]),"localization"/);
    if (!match) continue;

    try {
      return JSON.parse(match[1]);
    } catch {
      return [];
    }
  }
  return [];
};

const parseComboOptions = (document, control) => {
  const itemData = parseItemData(document, control);
  const list = document.querySelectorAll(`#${control.id}_DropDown li`);
  return [...list]
    .map((item, index) => ({
      text: normalize(item.textContent),
      value: item.getAttribute('value') || item.dataset.value || itemData[index]?.value || ''
    }))
    .filter((item) => item.text && item.text !== 'Seleccione un Idioma' && item.text !== 'Seleccione un curso');
};

const getPeriod = (document) => {
  const text = normalize(document.body?.textContent);
  const match = text.match(/Periodo\s+([0-9]{4}-[0-9]+)/i);
  return match?.[1] || null;
};

const createClientState = (document, control, option) => JSON.stringify({
  ...getClientState(document, control),
  value: option.value,
  text: option.text,
  enabled: true
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseTimeRanges = (text) => {
  const ranges = [];
  const regex = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const inicio = `${match[1].padStart(2, '0')}:${match[2]}`;
    const fin = `${match[3].padStart(2, '0')}:${match[4]}`;
    if (inicio < fin) ranges.push({ inicio, fin });
  }

  return ranges;
};

const parseGroups = (document) => {
  const rows = [...document.querySelectorAll('tr')];
  const groups = [];

  for (const row of rows) {
    const cells = [...row.children]
      .filter((cell) => (
        ['TD', 'TH'].includes(cell.tagName)
        && cell.style.display !== 'none'
      ))
      .map((cell) => normalize(cell.textContent));
    if (cells.length < 7) continue;

    const firstCell = cells[0];
    if (!firstCell || !firstCell.includes('_')) continue;

    const rowText = cells.join(' ');
    if (!/[0-9]{1,2}:[0-9]{2}\s*-\s*[0-9]{1,2}:[0-9]{2}/.test(rowText)) continue;

    const horarios = [];
    DAYS.forEach((day, dayIndex) => {
      const dayCell = cells[dayIndex + 2] || '';
      for (const range of parseTimeRanges(dayCell)) {
        horarios.push({
          dia: day.key,
          dia_nombre: day.label,
          inicio: range.inicio,
          fin: range.fin
        });
      }
    });

    groups.push({
      grupo: firstCell,
      clave: firstCell,
      profesor: cells[1] || '',
      horarios,
      salon: '',
      disponibilidad: cells[7] || '',
      observaciones: cells[8] || ''
    });
  }

  const unique = new Map();
  for (const group of groups) {
    const key = `${group.grupo}|${group.profesor}|${JSON.stringify(group.horarios)}`;
    unique.set(key, group);
  }
  return [...unique.values()];
};

export class BabelIdiomasScraper {
  constructor({ fetchImpl = globalThis.fetch, delayMs = defaultDelayMs, logger = console } = {}) {
    if (typeof fetchImpl !== 'function') throw new Error('Se requiere una implementación de fetch');
    this.fetchImpl = fetchImpl;
    this.delayMs = delayMs;
    this.logger = logger;
    this.cookieJar = new Map();
  }

  async request(method, body = null) {
    const headers = {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': userAgent,
      Referer: endpoint
    };
    const cookie = [...this.cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
    if (cookie) headers.Cookie = cookie;
    if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';

    const response = await this.fetchImpl(endpoint, {
      method,
      headers,
      body,
      redirect: 'follow'
    });
    updateCookieJar(this.cookieJar, response.headers);

    if (!response.ok) {
      throw new Error(`Babel respondió HTTP ${response.status} en ${method} ${endpoint}`);
    }

    return new JSDOM(await response.text()).window.document;
  }

  async getInitialPage() {
    this.cookieJar.clear();
    return this.request('GET');
  }

  async postback(document, control, option) {
    const fields = formFieldsFromDocument(document);
    fields.set('__EVENTTARGET', control.uniqueId);
    fields.set('__EVENTARGUMENT', 'arguments');
    fields.set(control.id, option.text);
    fields.set(`${control.id}_ClientState`, createClientState(document, control, option));

    await sleep(this.delayMs);
    return this.request('POST', fields.toString());
  }

  async scrapeLanguage(languageOption, period) {
    const initial = await this.getInitialPage();
    const languagePage = await this.postback(initial, CONTROLS.idioma, languageOption);
    const courses = parseComboOptions(languagePage, CONTROLS.tipoCurso);
    const groups = [];
    const combinations = [];

    for (const course of courses) {
      const coursePage = await this.postback(languagePage, CONTROLS.tipoCurso, course);
      const levels = parseComboOptions(coursePage, CONTROLS.nivel);

      for (const level of levels) {
        const levelPage = await this.postback(coursePage, CONTROLS.nivel, level);
        const modalities = parseComboOptions(levelPage, CONTROLS.modalidad);

        for (const modality of modalities) {
          const resultPage = await this.postback(levelPage, CONTROLS.modalidad, modality);
          const resultGroups = parseGroups(resultPage).map((group) => ({
            ...group,
            idioma_codigo: languageOption.value,
            idioma: languageOption.text,
            tipo_curso_codigo: course.value,
            tipo_curso: course.text,
            nivel_codigo: level.value,
            nivel: level.text,
            modalidad_codigo: modality.value,
            modalidad: modality.text
          }));

          groups.push(...resultGroups);
          combinations.push({
            tipo_curso: course.text,
            nivel: level.text,
            modalidad: modality.text,
            grupos: resultGroups.length
          });
        }
      }
    }

    const uniqueGroups = new Map();
    for (const group of groups) {
      const key = [
        group.grupo,
        group.tipo_curso_codigo,
        group.nivel_codigo,
        group.modalidad_codigo,
        group.profesor,
        JSON.stringify(group.horarios)
      ].join('|');
      uniqueGroups.set(key, group);
    }

    return {
      codigo: languageOption.value,
      slug: slugify(languageOption.text),
      nombre: languageOption.text,
      periodo: period,
      fecha_consulta: new Date().toISOString(),
      fuente: endpoint,
      grupos: [...uniqueGroups.values()],
      combinaciones: combinations
    };
  }

  async scrapeAll({ only = null } = {}) {
    const initial = await this.getInitialPage();
    const period = getPeriod(initial);
    const languages = parseComboOptions(initial, CONTROLS.idioma);
    if (!period) throw new Error('No se pudo detectar el periodo de Babel');
    if (!languages.length) throw new Error('Babel no publicó opciones de idiomas');

    const selectedLanguages = only
      ? languages.filter((language) => [language.value, language.text, slugify(language.text)]
        .some((candidate) => String(candidate).toLowerCase() === String(only).toLowerCase()))
      : languages;

    if (only && !selectedLanguages.length) {
      throw new Error(`No se encontró el idioma solicitado: ${only}`);
    }

    const result = {
      periodo: period,
      fecha_actualizacion: new Date().toISOString(),
      fuente: endpoint,
      idiomas: []
    };

    for (const language of selectedLanguages) {
      this.logger.log(`Procesando idioma: ${language.text}`);
      const data = await this.scrapeLanguage(language, period);
      this.logger.log(`  ${data.grupos.length} grupos en ${data.combinaciones.length} combinaciones`);
      result.idiomas.push(data);
    }

    return result;
  }
}

const writeOutput = (result) => {
  const idiomasDir = path.join(repoRoot, 'data', 'idiomas');
  const previousMetadata = readJsonFile(path.join(idiomasDir, 'metadata.json'), { idiomas: {} });
  const index = {
    periodo: result.periodo,
    fecha_actualizacion: result.fecha_actualizacion,
    fuente: result.fuente,
    total_idiomas: result.idiomas.length,
    idiomas: {}
  };
  const metadata = {
    periodo: result.periodo,
    fecha_actualizacion: result.fecha_actualizacion,
    fuente: result.fuente,
    total_idiomas: result.idiomas.length,
    idiomas: {}
  };
  const changes = {
    periodo: result.periodo,
    fecha_actualizacion: result.fecha_actualizacion,
    total_cambios: 0,
    idiomas: []
  };

  for (const idioma of result.idiomas) {
    const fileName = `${idioma.slug}.json`;
    writeJsonFile(path.join(idiomasDir, fileName), idioma);
    const hash = hashIdioma(idioma);
    const previous = previousMetadata.idiomas?.[idioma.codigo];
    const lastChanged = previous?.hash === hash
      ? previous.last_changed
      : result.fecha_actualizacion;

    index.idiomas[idioma.codigo] = {
      codigo: idioma.codigo,
      slug: idioma.slug,
      nombre: idioma.nombre,
      total_grupos: idioma.grupos.length
    };
    metadata.idiomas[idioma.codigo] = {
      codigo: idioma.codigo,
      slug: idioma.slug,
      nombre: idioma.nombre,
      hash,
      last_changed: lastChanged
    };
    if (!previous || previous.hash !== hash) {
      changes.idiomas.push({
        codigo: idioma.codigo,
        slug: idioma.slug,
        nombre: idioma.nombre
      });
    }
  }

  changes.total_cambios = changes.idiomas.length;
  writeJsonFile(path.join(idiomasDir, 'index.json'), index);
  writeJsonFile(path.join(idiomasDir, 'metadata.json'), metadata);
  writeJsonFile(path.join(idiomasDir, 'changes.json'), changes);
  return { index, changes };
};

const getArg = (args, name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] || null;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const only = getArg(args, '--only');
  const noWrite = args.includes('--no-write');
  const scraper = new BabelIdiomasScraper();

  try {
    const result = await scraper.scrapeAll({ only });
    if (noWrite) {
      console.log(JSON.stringify({
        periodo: result.periodo,
        idiomas: result.idiomas.map((idioma) => ({
          codigo: idioma.codigo,
          nombre: idioma.nombre,
          grupos: idioma.grupos.length,
          combinaciones: idioma.combinaciones.length
        }))
      }, null, 2));
    } else {
      const output = writeOutput(result);
      console.log(`Datos de idiomas guardados en ${path.join(repoRoot, 'data', 'idiomas')}`);
      console.log(`Cambios detectados: ${output.changes.total_cambios}`);
    }
  } catch (error) {
    console.error(`Error en scraper de idiomas: ${error.message}`);
    process.exitCode = 1;
  }
}

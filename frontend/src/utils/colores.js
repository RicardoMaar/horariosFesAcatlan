// Variantes de color para los bloques de materia.
// Cada color base (barra) tiene un relleno suave y un texto legible,
// definidos tanto para modo claro como oscuro. Los colores base coinciden
// con la paleta del store (`coloresBase` en useHorariosStore) y con los
// swatches del SelectorColor.

// key = color de la barra (hex en mayúsculas) -> variantes tintadas.
export const VARIANTES = {
  '#3B82F6': { fL: '#E4EDFF', tL: '#1E40AF', fD: '#1E2A4D', tD: '#9DBEFF' }, // azul
  '#EF4444': { fL: '#FCE4E4', tL: '#991B1B', fD: '#3A1D1D', tD: '#FCA5A5' }, // rojo
  '#10B981': { fL: '#D6F5EA', tL: '#047857', fD: '#123A2E', tD: '#6EE7B7' }, // esmeralda
  '#F59E0B': { fL: '#FCEFD2', tL: '#92400E', fD: '#3A2B12', tD: '#F5C876' }, // ámbar
  '#8B5CF6': { fL: '#EFEAFE', tL: '#5B21B6', fD: '#2C2447', tD: '#C9B8FB' }, // violeta
  '#EC4899': { fL: '#FBE2EF', tL: '#9D174D', fD: '#3A1829', tD: '#F49FC9' }, // rosa
  '#06B6D4': { fL: '#D7F3F9', tL: '#155E75', fD: '#0F323C', tD: '#74DBEE' }, // cian
  '#84CC16': { fL: '#EAF7D2', tL: '#4D7C0F', fD: '#26330F', tD: '#BEF264' }, // lima
  '#F97316': { fL: '#FCE6D6', tL: '#9A3412', fD: '#3A2413', tD: '#F6B183' }, // naranja
  '#6366F1': { fL: '#E6E7FE', tL: '#3730A3', fD: '#232551', tD: '#AEB4FB' }  // índigo
};

// Neutros de superficie usados para mezclar rellenos cuando el color es
// personalizado (no está en la tabla de arriba).
const SURFACE_LIGHT = '#FFFFFF';
const SURFACE_DARK = '#1E1B24';
const INK_LIGHT = '#1A1620';

const hexToRgb = (hex) => {
  let h = (hex || '').replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

// Mezcla `hex` con `otro`, donde `amount` es la fracción de `otro` (0..1).
const mezclar = (hex, otro, amount) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(otro);
  if (!a || !b) return hex;
  const r = a.r * (1 - amount) + b.r * amount;
  const g = a.g * (1 - amount) + b.g * amount;
  const bl = a.b * (1 - amount) + b.b * amount;
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
};

/**
 * Devuelve las variantes de un bloque para un color de barra dado.
 * @param {string} colorBarra - hex asignado a la materia (barra izquierda).
 * @param {boolean} dark - si el tema activo es oscuro.
 * @returns {{ bar: string, fill: string, text: string }}
 */
export const getVariante = (colorBarra, dark) => {
  const bar = colorBarra || '#8B5CF6';
  const key = bar.toUpperCase();
  const curada = VARIANTES[key];

  if (curada) {
    return { bar, fill: dark ? curada.fD : curada.fL, text: dark ? curada.tD : curada.tL };
  }

  // Color personalizado: mezclamos para obtener relleno suave y texto legible.
  const fill = dark ? mezclar(bar, SURFACE_DARK, 0.78) : mezclar(bar, SURFACE_LIGHT, 0.86);
  const text = dark ? mezclar(bar, SURFACE_LIGHT, 0.45) : mezclar(bar, INK_LIGHT, 0.28);
  return { bar, fill, text };
};

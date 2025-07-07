/**
 * Convierte una hora en formato HH:MM a minutos desde medianoche
 * @param {string} hora - Hora en formato "HH:MM"
 * @returns {number} - Minutos desde medianoche
 */
export const horaAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

/**
 * Convierte minutos a formato de hora HH:MM
 * @param {number} minutos - Minutos desde medianoche
 * @returns {string} - Hora en formato "HH:MM"
 */
export const minutosAHora = (minutos) => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Verifica si hay traslape entre dos intervalos de tiempo en el mismo día
 * @param {string} inicio1 - Hora de inicio del primer intervalo "HH:MM"
 * @param {string} fin1 - Hora de fin del primer intervalo "HH:MM"
 * @param {string} inicio2 - Hora de inicio del segundo intervalo "HH:MM"
 * @param {string} fin2 - Hora de fin del segundo intervalo "HH:MM"
 * @returns {boolean} - true si hay traslape, false si no
 */
export const hayTraslapeHorario = (inicio1, fin1, inicio2, fin2) => {
  const min1Inicio = horaAMinutos(inicio1);
  const min1Fin = horaAMinutos(fin1);
  const min2Inicio = horaAMinutos(inicio2);
  const min2Fin = horaAMinutos(fin2);
  
  // Dos intervalos se traslapan si uno empieza antes de que termine el otro
  return min1Inicio < min2Fin && min2Inicio < min1Fin;
};

/**
 * Verifica si hay traslape entre los horarios de dos materias
 * @param {Array} horarios1 - Array de horarios de la primera materia
 * @param {Array} horarios2 - Array de horarios de la segunda materia
 * @returns {boolean} - true si hay traslape, false si no
 */
export const hayTraslapeEntreHorarios = (horarios1, horarios2) => {
  if (!horarios1 || !horarios2) return false;
  
  for (const h1 of horarios1) {
    for (const h2 of horarios2) {
      if (h1.dia === h2.dia) {
        if (hayTraslapeHorario(h1.inicio, h1.fin, h2.inicio, h2.fin)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Verifica si hay traslape entre dos materias completas
 * @param {Object} materia1 - Primera materia con propiedad horarios
 * @param {Object} materia2 - Segunda materia con propiedad horarios
 * @returns {boolean} - true si hay traslape, false si no
 */
export const hayTraslapeMaterias = (materia1, materia2) => {
  return hayTraslapeEntreHorarios(materia1.horarios, materia2.horarios);
};

/**
 * Detecta todos los traslapes en una lista de materias seleccionadas
 * @param {Array} materiasSeleccionadas - Array de materias seleccionadas
 * @returns {Array} - Array de objetos con información de traslapes
 */
export const detectarTraslapes = (materiasSeleccionadas) => {
  const traslapes = [];
  
  for (let i = 0; i < materiasSeleccionadas.length; i++) {
    for (let j = i + 1; j < materiasSeleccionadas.length; j++) {
      const materia1 = materiasSeleccionadas[i];
      const materia2 = materiasSeleccionadas[j];
      
      if (hayTraslapeMaterias(materia1, materia2)) {
        traslapes.push({
          materia1: materia1.nombre,
          materia2: materia2.nombre,
          grupo1: materia1.grupo,
          grupo2: materia2.grupo,
          id1: materia1.id,
          id2: materia2.id
        });
      }
    }
  }
  
  return traslapes;
};

/**
 * Obtiene un Set con los IDs de todas las materias que tienen traslapes
 * @param {Array} materiasSeleccionadas - Array de materias seleccionadas
 * @returns {Set} - Set con los IDs de materias que tienen traslapes
 */
export const getMateriasConTraslapes = (materiasSeleccionadas) => {
  const traslapesSet = new Set();
  
  for (let i = 0; i < materiasSeleccionadas.length; i++) {
    for (let j = i + 1; j < materiasSeleccionadas.length; j++) {
      const materia1 = materiasSeleccionadas[i];
      const materia2 = materiasSeleccionadas[j];
      
      if (hayTraslapeMaterias(materia1, materia2)) {
        traslapesSet.add(materia1.id);
        traslapesSet.add(materia2.id);
      }
    }
  }
  
  return traslapesSet;
};  
import { horaAMinutos } from './traslapes';
import { CALENDARIO_CONFIG } from '../constants/calendario';

export const calcularPosicionBloque = (horario, scaleFactor = 1) => {
  const { HORA_INICIO, PX_POR_HORA } = CALENDARIO_CONFIG;

  const [horaInicio, minInicio] = horario.inicio.split(':').map(Number);
  const [horaFin, minFin] = horario.fin.split(':').map(Number);

  const minutosInicio = (horaInicio - HORA_INICIO) * 60 + minInicio;
  const minutosFin = (horaFin - HORA_INICIO) * 60 + minFin;

  const top = (minutosInicio / 60) * PX_POR_HORA * scaleFactor;
  const height = ((minutosFin - minutosInicio) / 60) * PX_POR_HORA * scaleFactor;

  return { top, height };
};

// Altura de cada hora en px (ya escalada para mobile).
export const alturaHora = (scaleFactor = 1) => CALENDARIO_CONFIG.PX_POR_HORA * scaleFactor;

// Altura total de la rejilla (desde HORA_INICIO hasta HORA_FIN).
export const alturaTotal = (scaleFactor = 1) =>
  (CALENDARIO_CONFIG.HORA_FIN - CALENDARIO_CONFIG.HORA_INICIO) * alturaHora(scaleFactor);

// Etiquetas de horas en punto: ['07:00', '08:00', ...].
export const generarHorasEnPunto = () => {
  const { HORA_INICIO, HORA_FIN } = CALENDARIO_CONFIG;
  const result = [];
  for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
    result.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return result;
};

export const generarHoras = () => {
  const { HORA_INICIO, HORA_FIN } = CALENDARIO_CONFIG;
  const result = [];

  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    result.push(`${h.toString().padStart(2, '0')}:00`);
    result.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return result;
};

export const organizarBloquesPorColumnas = (bloquesDelDia) => {
  // Ordenar por hora de inicio
  bloquesDelDia.sort((a, b) => {
    const aInicio = horaAMinutos(a.horario.inicio);
    const bInicio = horaAMinutos(b.horario.inicio);
    return aInicio - bInicio;
  });

  // Crear grupos de bloques que se traslapan entre sí
  const grupos = [];
  bloquesDelDia.forEach(bloque => {
    const bloqueInicio = horaAMinutos(bloque.horario.inicio);
    const bloqueFin = horaAMinutos(bloque.horario.fin);
    
    // Buscar un grupo existente donde este bloque traslape
    let grupoEncontrado = false;
    for (const grupo of grupos) {
      // Verificar si traslapa con algún bloque del grupo
      const traslapaConGrupo = grupo.some(b => {
        const bInicio = horaAMinutos(b.horario.inicio);
        const bFin = horaAMinutos(b.horario.fin);
        return bloqueInicio < bFin && bInicio < bloqueFin;
      });
      
      if (traslapaConGrupo) {
        grupo.push(bloque);
        grupoEncontrado = true;
        break;
      }
    }
    
    // Si no encontró grupo, crear uno nuevo
    if (!grupoEncontrado) {
      grupos.push([bloque]);
    }
  });

  // Asignar columnas dentro de cada grupo
  grupos.forEach(grupo => {
    grupo.sort((a, b) => {
      const aInicio = horaAMinutos(a.horario.inicio);
      const bInicio = horaAMinutos(b.horario.inicio);
      return aInicio - bInicio;
    });

    grupo.forEach((bloque, index) => {
      let columna = 0;
      const bloqueInicio = horaAMinutos(bloque.horario.inicio);
      const bloqueFin = horaAMinutos(bloque.horario.fin);

      // Verificar contra bloques anteriores del mismo grupo
      for (let i = 0; i < index; i++) {
        const otroBloque = grupo[i];
        const otroInicio = horaAMinutos(otroBloque.horario.inicio);
        const otroFin = horaAMinutos(otroBloque.horario.fin);

        // Si hay sobreposición temporal y misma columna
        if (bloqueInicio < otroFin && otroInicio < bloqueFin) {
          if (otroBloque.columna === columna) {
            columna++;
          }
        }
      }

      bloque.columna = columna;
      bloque.totalColumnas = Math.max(...grupo.map(b => b.columna || 0)) + 1;
    });
  });
};
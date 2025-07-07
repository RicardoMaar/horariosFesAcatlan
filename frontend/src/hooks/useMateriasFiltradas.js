import { useMemo } from 'react';
import { filtrarMaterias, agruparMateriasPorSemestre } from '../utils/busqueda';
import { getMateriasConTraslapes } from '../utils/traslapes';

export function useMateriasFiltradas(materiasData, busqueda) {
  const materiasFiltradas = useMemo(() => {
    return filtrarMaterias(materiasData, busqueda);
  }, [materiasData, busqueda]);

  return materiasFiltradas;
}

export function useMateriasPorSemestre(materiasData, materiasFiltradas) {
  return useMemo(() => {
    const materias = materiasFiltradas || materiasData;
    return agruparMateriasPorSemestre(materias);
  }, [materiasData, materiasFiltradas]);
}

export function useTraslapes(materiasSeleccionadas) {
  return useMemo(() => {
    return getMateriasConTraslapes(materiasSeleccionadas);
  }, [materiasSeleccionadas]);
}
import React from 'react';
import useHorariosStore from '../store/useHorariosStore';
import SemestreItem from './listaMaterias/SemestreItem';
import EmptyState from './listaMaterias/EmptyState';
import { useExpansionStates } from '../hooks/useExpansion';
import { useMateriasFiltradas, useMateriasPorSemestre, useTraslapes } from '../hooks/useMateriasFiltradas';
import '../styles/animations.css';

function ListaMaterias() {
  const materiasData = useHorariosStore(state => state.materiasData);
  const busqueda = useHorariosStore(state => state.busqueda);
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const toggleMateria = useHorariosStore(state => state.toggleMateria);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const abrirModal = useHorariosStore(state => state.abrirModal);
  
  const materiasFiltradas = useMateriasFiltradas(materiasData, busqueda);
  const materiasPorSemestre = useMateriasPorSemestre(materiasData, materiasFiltradas);
  const traslapes = useTraslapes(materiasSeleccionadas);
  
  const {
    semestresExpandidos,
    materiasExpandidas,
    toggleSemestre,
    toggleMateriaClave
  } = useExpansionStates(busqueda, materiasFiltradas);

  if (Object.keys(materiasPorSemestre).length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      {Object.entries(materiasPorSemestre).map(([semestre, materias]) => (
        <SemestreItem
          key={semestre}
          semestre={semestre}
          materias={materias}
          expandido={semestresExpandidos[semestre]}
          materiasExpandidas={materiasExpandidas}
          onToggleSemestre={toggleSemestre}
          onToggleMateria={toggleMateria}
          onToggleMateriaExpand={toggleMateriaClave}
          onClickDetalle={abrirModal}
          materiasSeleccionadas={materiasSeleccionadas}
          coloresAsignados={coloresAsignados}
          traslapes={traslapes}
        />
      ))}
    </div>
  );
}

export default ListaMaterias;
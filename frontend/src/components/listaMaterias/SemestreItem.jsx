import React from 'react';
import MateriaItem from './MateriaItem';
import { getSemestreLabel } from '../../constants/listaMaterias';

const SemestreItem = React.memo(({
  semestre,
  materias,
  expandido,
  materiasExpandidas,
  onToggleSemestre,
  onToggleMateria,
  onToggleMateriaExpand,
  onClickDetalle,
  materiasSeleccionadas,
  coloresAsignados,
  traslapes
}) => {
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <button
        onClick={() => onToggleSemestre(semestre)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
      >
        <span className="font-semibold text-sm text-gray-700">
          {getSemestreLabel(semestre)}
        </span>
        <div className="flex items-center gap-2">
          <svg 
            className={`w-4 h-4 arrow-icon ${expandido ? 'rotated' : ''} transition-transform duration-300 ease-in-out`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className={`semestre-expand ${expandido ? 'semestre-expanded' : 'semestre-collapsed'} transition-all duration-300 ease-in-out overflow-hidden`}>
        <div className="border-t border-gray-100">
          {materias.map((materia, index) => (
            <MateriaItem
              key={materia.clave}
              materia={materia}
              index={index}
              expandido={materiasExpandidas[materia.clave]}
              expandidoSemestre={expandido}
              gruposExpandidos={materiasExpandidas[materia.clave]}
              onToggleExpand={onToggleMateriaExpand}
              onToggleMateria={onToggleMateria}
              onClickDetalle={onClickDetalle}
              materiasSeleccionadas={materiasSeleccionadas}
              coloresAsignados={coloresAsignados}
              traslapes={traslapes}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

SemestreItem.displayName = 'SemestreItem';

export default SemestreItem;
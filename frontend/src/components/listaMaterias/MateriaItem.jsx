import React from 'react';
import GrupoItem from './GrupoItem';
import { ANIMATION_CONFIG } from '../../constants/listaMaterias';

const MateriaItem = React.memo(({
  materia,
  index,
  expandido,
  expandidoSemestre,
  gruposExpandidos,
  onToggleExpand,
  onToggleMateria,
  onClickDetalle,
  materiasSeleccionadas,
  coloresAsignados,
  traslapes
}) => {
  return (
    <div 
      className={`materia-item border-t border-gray-50 first:border-t-0 transition-all duration-200 ${
        expandidoSemestre 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-2 opacity-0'
      }`}
      style={{ 
        transitionDelay: expandidoSemestre ? `${index * ANIMATION_CONFIG.ITEM_DELAY}ms` : '0ms' 
      }}
    >
      <button
        onClick={() => onToggleExpand(materia.clave)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 text-left"
      >
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900">
            {materia.nombre}
          </h4>
          <p className="text-xs text-gray-500">
            Clave: {materia.clave} • {materia.grupos.length} grupo{materia.grupos.length !== 1 && 's'}
          </p>
        </div>
        <svg 
          className={`w-4 h-4 arrow-icon ${expandido ? 'rotated' : ''} transition-transform duration-300 ease-in-out`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`semestre-expand ${expandido ? 'semestre-expanded' : 'semestre-collapsed'} transition-all duration-300 ease-in-out overflow-hidden bg-gray-50`}>
        {materia.grupos.map((grupo, grupoIndex) => {
          const id = `${materia.clave}-${grupo.grupo}`;
          const seleccionada = materiasSeleccionadas.some(m => m.id === id);
          const tieneTraslape = seleccionada && traslapes.has(id);
          const color = coloresAsignados[id];

          return (
            <GrupoItem
              key={grupo.grupo}
              grupo={grupo}
              materia={materia}
              index={grupoIndex}
              seleccionada={seleccionada}
              tieneTraslape={tieneTraslape}
              color={color}
              expandido={expandido || gruposExpandidos}
              onToggle={onToggleMateria}
              onClickDetalle={onClickDetalle}
            />
          );
        })}
      </div>
    </div>
  );
});

MateriaItem.displayName = 'MateriaItem';

export default MateriaItem;
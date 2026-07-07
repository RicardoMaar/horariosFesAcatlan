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
  const anySelected = materia.grupos.some(g =>
    materiasSeleccionadas.some(m => m.id === `${materia.clave}-${g.grupo}`)
  );

  return (
    <div
      className={`materia-item transition-all duration-200 ${
        expandidoSemestre ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      style={{
        borderBottom: '1px solid var(--border-faint)',
        transitionDelay: expandidoSemestre ? `${index * ANIMATION_CONFIG.ITEM_DELAY}ms` : '0ms'
      }}
    >
      <button
        onClick={() => onToggleExpand(materia.clave)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 transition-colors text-left"
        style={{ background: anySelected ? 'var(--primary-soft)' : 'transparent' }}
      >
        <span className="flex-1 min-w-0">
          <span className="block font-medium text-[13px] text-[var(--text)] leading-tight">
            {materia.nombre}
          </span>
          <span className="block text-[11px] text-[var(--muted)] mt-0.5">
            Clave {materia.clave} · {materia.grupos.length} grupo{materia.grupos.length !== 1 && 's'}
          </span>
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          {anySelected && (
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: 'var(--primary)' }} />
          )}
          <svg
            className={`w-4 h-4 arrow-icon ${expandido ? 'rotated' : ''} transition-transform duration-300`}
            style={{ color: 'var(--muted-2)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div
        className={`semestre-expand ${expandido ? 'semestre-expanded' : 'semestre-collapsed'} transition-all duration-300 ease-in-out overflow-hidden`}
        style={{ background: 'var(--surface2)' }}
      >
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

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
    <div
      className="overflow-hidden"
      style={{
        border: '1px solid var(--border)',
        borderRadius: '13px',
        background: 'var(--surface)'
      }}
    >
      <button
        onClick={() => onToggleSemestre(semestre)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 transition-colors"
        style={{ background: 'var(--surface2)' }}
      >
        <span className="flex items-center gap-2.5">
          <svg
            className={`w-3.5 h-3.5 arrow-icon ${expandido ? 'rotated' : ''} transition-transform duration-300`}
            style={{ color: 'var(--muted-2)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-semibold text-[13.5px] text-[var(--text)]">
            {getSemestreLabel(semestre)}
          </span>
        </span>
        <span
          className="text-[10.5px]"
          style={{
            color: 'var(--muted)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '2px 8px',
            borderRadius: '20px'
          }}
        >
          {materias.length} materias
        </span>
      </button>

      <div className={`semestre-expand ${expandido ? 'semestre-expanded' : 'semestre-collapsed'} transition-all duration-300 ease-in-out overflow-hidden`}>
        <div style={{ borderTop: '1px solid var(--border)' }}>
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

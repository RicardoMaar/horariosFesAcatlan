import React from 'react';
import { ANIMATION_CONFIG } from '../../constants/listaMaterias';

const GrupoItem = React.memo(({
  grupo,
  materia,
  index,
  seleccionada,
  tieneTraslape,
  color,
  expandido,
  onToggle,
  onClickDetalle
}) => {
  const id = `${materia.clave}-${grupo.grupo}`;

  const handleClick = (e) => {
    if (!e.target.closest('input[type="checkbox"]')) {
      const materiaConGrupo = {
        id,
        clave: materia.clave,
        nombre: materia.nombre,
        grupo: grupo.grupo,
        profesor: grupo.profesor,
        salon: grupo.salon,
        horarios: grupo.horarios,
        semestre: materia.semestre
      };
      onClickDetalle(materiaConGrupo);
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`
        grupo-item px-3 py-2 text-xs border-t border-gray-100 transition-all duration-200 cursor-pointer
        ${seleccionada ? 'bg-primary-50' : 'hover:bg-white'}
        ${tieneTraslape ? 'bg-red-50' : ''}
        ${expandido 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-1 opacity-0'
        }
      `}
      style={{ 
        transitionDelay: expandido ? `${index * ANIMATION_CONFIG.GRUPO_DELAY}ms` : '0ms' 
      }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label 
              className="flex items-center cursor-pointer"
              onClick={handleCheckboxClick}
            >
              <input
                type="checkbox"
                checked={seleccionada}
                onChange={() => onToggle(materia.clave, grupo)}
                className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors duration-200"
              />
              <span className="font-medium">
                Grupo {grupo.grupo}
              </span>
            </label>
            {seleccionada && (
              <div 
                className="w-3 h-3 rounded-full color-circle transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: color }}
              />
            )}
            {tieneTraslape && (
              <span className="text-red-600 text-xs animate-pulse">
                ⚠️ Traslape
              </span>
            )}
          </div>
          <div className="mt-1 text-gray-600 ml-6">
            {grupo.profesor}
          </div>
          <div className="mt-1 text-gray-500 ml-6">
            {grupo.horarios.map(h => `${h.dia} ${h.inicio}-${h.fin}`).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
});

GrupoItem.displayName = 'GrupoItem';

export default GrupoItem;
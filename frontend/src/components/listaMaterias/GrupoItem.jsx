import React, { startTransition } from 'react';
import { ANIMATION_CONFIG } from '../../constants/listaMaterias';
import useHorariosStore from '../../store/useHorariosStore';

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

  // Anomalía de carga a nivel de grupo (horas del horario != plan de estudios / demás grupos)
  const anomaliaMateria = useHorariosStore(state => state.anomaliasData?.[materia.clave]);
  const grupoAnomalo = anomaliaMateria?.grupos_afectados?.find(g => g.grupo === grupo.grupo);
  const mensajeAnomalia = grupoAnomalo
    ? `Posible error. Este grupo marca ${grupoAnomalo.horas_semana} h a la semana cuando deberían ser ${anomaliaMateria.esperado_horas_semana}. Verifícalo antes de inscribirte.`
    : null;

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

  // Clic directo en la fila => agrega/quita el grupo del horario.
  const handleToggle = () => {
    startTransition(() => {
      onToggle(materia.clave, grupo);
    });
  };

  // Botón "Detalles" => abre el modal del grupo (sin togglear).
  const handleDetalle = (e) => {
    e.stopPropagation();
    startTransition(() => {
      onClickDetalle(materiaConGrupo);
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={`grupo-item flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-transform transition-opacity duration-200 ${
        expandido ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
      }`}
      style={{
        borderTop: '1px solid var(--border-faint)',
        borderLeft: `3px solid ${seleccionada ? color : 'transparent'}`,
        background: seleccionada ? 'var(--primary-soft)' : 'transparent',
        transitionDelay: expandido ? `${index * ANIMATION_CONFIG.GRUPO_DELAY}ms` : '0ms'
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-[var(--text)]">
            Grupo {grupo.grupo}
          </span>
          {seleccionada && (
            <span
              className="w-2 h-2 rounded-full color-circle flex-shrink-0"
              style={{ background: color }}
            />
          )}
          {mensajeAnomalia && (
            <span
              tabIndex={0}
              title={mensajeAnomalia}
              aria-label={mensajeAnomalia}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] leading-none cursor-help select-none flex-shrink-0"
              style={{
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger)',
                color: 'var(--danger-text)'
              }}
            >
              ⚠
            </span>
          )}
          {tieneTraslape && (
            <span
              className="text-[10px] font-semibold px-1.5 py-px rounded flex-shrink-0"
              style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}
            >
              traslape
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-[var(--muted)] leading-snug truncate">
          {grupo.profesor}
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--muted-2)] truncate">
          {grupo.horarios.map(h => `${h.dia} ${h.inicio}-${h.fin}`).join(', ')}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDetalle}
        className="flex-shrink-0 self-center px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--muted)'
        }}
      >
        Detalles
      </button>
    </div>
  );
});

GrupoItem.displayName = 'GrupoItem';

export default GrupoItem;

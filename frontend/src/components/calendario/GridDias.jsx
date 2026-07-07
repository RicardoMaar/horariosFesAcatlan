import React from 'react';
import BloqueMateria from './BloqueMateria';
import { CALENDARIO_CONFIG } from '../../constants/calendario';
import { alturaHora, alturaTotal } from '../../utils/calendario';
import useHorariosStore from '../../store/useHorariosStore';

const construirGradiente = (hora) => {
  const media = hora / 2;
  return [
    // Línea fuerte en la hora en punto.
    `repeating-linear-gradient(to bottom, var(--cal-strong) 0, var(--cal-strong) 1px, transparent 1px, transparent ${hora}px)`,
    // Línea tenue en la media hora.
    `repeating-linear-gradient(to bottom, transparent 0, transparent ${media}px, var(--cal-faint) ${media}px, var(--cal-faint) ${media + 1}px, transparent ${media + 1}px, transparent ${hora}px)`
  ].join(',');
};

const GridDias = React.memo(({
  diasParaMostrar,
  bloquesPorDia,
  isMobile = false,
  bloquesAnimando,
  bloquesParaQuitar
}) => {
  const scaleFactor = isMobile ? CALENDARIO_CONFIG.MOBILE_SCALE_FACTOR : 1;
  const hora = alturaHora(scaleFactor);
  const total = alturaTotal(scaleFactor);
  const backgroundImage = construirGradiente(hora);

  const modalAbierto = useHorariosStore(state => state.modalAbierto);
  const bloqueModalActivo = useHorariosStore(state => state.bloqueModalActivo);
  const abrirModal = useHorariosStore(state => state.abrirModal);
  const toggleMateria = useHorariosStore(state => state.toggleMateria);

  const handleRemove = (bloque) => {
    toggleMateria(bloque.clave, { grupo: bloque.grupo });
  };

  return (
    <>
      {diasParaMostrar.map(dia => (
        <div
          key={dia}
          className="relative"
          style={{
            height: `${total}px`,
            background: 'var(--surface)',
            backgroundImage,
            borderLeft: '1px solid var(--border)'
          }}
        >
          {bloquesPorDia[dia].map((bloque, index) => {
            const bloqueKey = `${bloque.id}-${index}`;
            const esNuevo = bloquesAnimando.has(bloqueKey);
            const seEstaQuitando = bloquesParaQuitar.has(bloqueKey) || bloque.esFantasma;

            const esBloqueDelModal = modalAbierto &&
              bloqueModalActivo?.id === bloque.id &&
              bloqueModalActivo?.horario?.dia === bloque.horario.dia &&
              bloqueModalActivo?.horario?.inicio === bloque.horario.inicio;

            return (
              <BloqueMateria
                key={bloqueKey}
                bloque={bloque}
                scaleFactor={scaleFactor}
                isMobile={isMobile}
                esNuevo={esNuevo}
                seEstaQuitando={seEstaQuitando}
                esBloqueDelModal={esBloqueDelModal}
                onBloqueClick={abrirModal}
                onRemove={handleRemove}
              />
            );
          })}
        </div>
      ))}
    </>
  );
});

GridDias.displayName = 'GridDias';

export default GridDias;

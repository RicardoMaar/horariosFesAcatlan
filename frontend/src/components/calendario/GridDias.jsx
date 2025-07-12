import React from 'react';
import BloqueMateria from './BloqueMateria';
import { generarHoras } from '../../utils/calendario';
import { CALENDARIO_CONFIG } from '../../constants/calendario';
import useHorariosStore from '../../store/useHorariosStore';

const GridDias = React.memo(({ 
  diasParaMostrar, 
  bloquesPorDia, 
  isMobile = false,
  bloquesAnimando,
  bloquesParaQuitar
}) => {
  const horas = generarHoras();
  const slotHeight = isMobile 
    ? CALENDARIO_CONFIG.SLOT_HEIGHT * CALENDARIO_CONFIG.MOBILE_SCALE_FACTOR 
    : CALENDARIO_CONFIG.SLOT_HEIGHT;
  const scaleFactor = isMobile ? CALENDARIO_CONFIG.MOBILE_SCALE_FACTOR : 1;
  
  const modalAbierto = useHorariosStore(state => state.modalAbierto);
  const bloqueModalActivo = useHorariosStore(state => state.bloqueModalActivo);
  const abrirModal = useHorariosStore(state => state.abrirModal);

  return (
    <>
      {diasParaMostrar.map(dia => (
        <div key={dia} className="relative bg-white">
          {/* Líneas de fondo para las horas */}
          {horas.map((_, index) => (
            <div 
              key={index}
              className={`border-t ${index % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
              style={{ height: `${slotHeight}rem` }}
            />
          ))}

          {/* Bloques de materias */}
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
                index={index}
                scaleFactor={scaleFactor}
                isMobile={isMobile}
                esNuevo={esNuevo}
                seEstaQuitando={seEstaQuitando}
                esBloqueDelModal={esBloqueDelModal}
                onBloqueClick={abrirModal}
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
import React from 'react';
import CalendarioDesktop from './calendario/CalendarioDesktop';
import CalendarioMobile from './calendario/CalendarioMobile';
import { useResponsive, useAnimacionesBloque, useBloquesPorDia } from '../hooks/useCalendario';
import useHorariosStore from '../store/useHorariosStore';
import '../styles/animations.css';
import '../styles/calendario.css';

function CalendarioSemanal() {
  const { isMobile } = useResponsive();
  const bloquesPorDia = useBloquesPorDia();
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const { bloquesAnimando, bloquesParaQuitar } = useAnimacionesBloque(materiasSeleccionadas);

  // Siempre mostrar el calendario, sin importar el estado
  if (isMobile) {
    return (
      <CalendarioMobile 
        bloquesPorDia={bloquesPorDia}
        bloquesAnimando={bloquesAnimando}
        bloquesParaQuitar={bloquesParaQuitar}
      />
    );
  }

  return (
    <CalendarioDesktop 
      bloquesPorDia={bloquesPorDia}
      bloquesAnimando={bloquesAnimando}
      bloquesParaQuitar={bloquesParaQuitar}
    />
  );
}

export default CalendarioSemanal;
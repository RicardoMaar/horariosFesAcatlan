import React, { useEffect } from 'react';
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

  // Debug temporal
  // useEffect(() => {
  //   console.log('Elementos del DOM:', {
  //     overflowAuto: document.querySelector('.overflow-x-auto'),
  //     tables: document.querySelectorAll('table'),
  //     grids: document.querySelectorAll('.grid'),
  //     calendars: document.querySelectorAll('[class*="calendar"]'),
  //     schedules: document.querySelectorAll('[class*="schedule"]'),
  //     horarios: document.querySelectorAll('[class*="horario"]')
  //   });
  // }, []);

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
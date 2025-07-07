import React from 'react';
import HeaderDias from './HeaderDias';
import ColumnaHoras from './ColumnaHoras';
import GridDias from './GridDias';
import { CALENDARIO_CONFIG } from '../../constants/calendario';

const CalendarioDesktop = React.memo(({ bloquesPorDia, bloquesAnimando, bloquesParaQuitar }) => {
  const { DIAS, DIAS_NOMBRES } = CALENDARIO_CONFIG;

  return (
    <div>
      <div className="w-full lg:min-w-[37.5rem]">
        {/* Header con días */}
        <div className="grid grid-cols-[5rem,repeat(6,1fr)] gap-px bg-gray-200 mb-px">
          <HeaderDias dias={DIAS_NOMBRES} />
        </div>

        {/* Grid del calendario */}
        <div className="relative">
          <div className="grid grid-cols-[5rem,repeat(6,1fr)] gap-px bg-gray-200">
            <ColumnaHoras />
            <GridDias
              diasParaMostrar={DIAS}
              bloquesPorDia={bloquesPorDia}
              bloquesAnimando={bloquesAnimando}
              bloquesParaQuitar={bloquesParaQuitar}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

CalendarioDesktop.displayName = 'CalendarioDesktop';

export default CalendarioDesktop;
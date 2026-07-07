import React from 'react';
import HeaderDias from './HeaderDias';
import ColumnaHoras from './ColumnaHoras';
import GridDias from './GridDias';
import { CALENDARIO_CONFIG } from '../../constants/calendario';

const COLS = '56px repeat(6, 1fr)';

const CalendarioDesktop = React.memo(({ bloquesPorDia, bloquesAnimando, bloquesParaQuitar }) => {
  const { DIAS, DIAS_NOMBRES } = CALENDARIO_CONFIG;

  return (
    <div style={{ minWidth: '660px' }}>
      {/* Header de días (sticky sobre el scroll) */}
      <div
        className="sticky top-0 z-[6] grid"
        style={{
          gridTemplateColumns: COLS,
          background: 'var(--surface)',
          paddingTop: '8px'
        }}
      >
        <HeaderDias dias={DIAS_NOMBRES} />
      </div>

      {/* Rejilla del calendario */}
      <div
        className="grid"
        style={{ gridTemplateColumns: COLS, paddingTop: '10px' }}
      >
        <ColumnaHoras />
        <GridDias
          diasParaMostrar={DIAS}
          bloquesPorDia={bloquesPorDia}
          bloquesAnimando={bloquesAnimando}
          bloquesParaQuitar={bloquesParaQuitar}
        />
      </div>
    </div>
  );
});

CalendarioDesktop.displayName = 'CalendarioDesktop';

export default CalendarioDesktop;

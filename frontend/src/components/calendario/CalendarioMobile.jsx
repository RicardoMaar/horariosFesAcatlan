import React from 'react';
import HeaderDias from './HeaderDias';
import ColumnaHoras from './ColumnaHoras';
import GridDias from './GridDias';
import { useSwipeNavigation } from '../../hooks/useCalendario';
import { CALENDARIO_CONFIG } from '../../constants/calendario';

const COLS = '46px repeat(3, 1fr)';

const CalendarioMobile = React.memo(({ bloquesPorDia, bloquesAnimando, bloquesParaQuitar }) => {
  const { DIAS, DIAS_NOMBRES } = CALENDARIO_CONFIG;
  const { currentView, handleTouchStart, handleTouchEnd } = useSwipeNavigation();

  const diasView1 = DIAS.slice(0, 3); // LU, MA, MI
  const diasView2 = DIAS.slice(3, 6); // JU, VI, SA
  const nombresView1 = DIAS_NOMBRES.slice(0, 3);
  const nombresView2 = DIAS_NOMBRES.slice(3, 6);

  const renderView = (dias, nombres) => (
    <div className="calendar-view">
      {/* Header con días */}
      <div className="grid" style={{ gridTemplateColumns: COLS, background: 'var(--surface)', paddingTop: '6px' }}>
        <HeaderDias dias={nombres} isMobile={true} />
      </div>

      {/* Rejilla del calendario */}
      <div className="grid" style={{ gridTemplateColumns: COLS, paddingTop: '10px' }}>
        <ColumnaHoras isMobile={true} />
        <GridDias
          diasParaMostrar={dias}
          bloquesPorDia={bloquesPorDia}
          isMobile={true}
          bloquesAnimando={bloquesAnimando}
          bloquesParaQuitar={bloquesParaQuitar}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div
        className="calendar-swipe-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="calendar-views-wrapper"
          style={{ transform: `translateX(-${currentView * 50}%)` }}
        >
          {renderView(diasView1, nombresView1)}
          {renderView(diasView2, nombresView2)}
        </div>
      </div>

      {/* Indicadores de página */}
      <div className="calendar-dots">
        <div className={`calendar-dot ${currentView === 0 ? 'active' : ''}`}></div>
        <div className={`calendar-dot ${currentView === 1 ? 'active' : ''}`}></div>
      </div>
    </div>
  );
});

CalendarioMobile.displayName = 'CalendarioMobile';

export default CalendarioMobile;

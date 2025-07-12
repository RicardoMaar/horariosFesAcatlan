import React from 'react';
import { CALENDARIO_CONFIG } from '../../constants/calendario';
import { generarHoras } from '../../utils/calendario';

const ColumnaHoras = React.memo(({ isMobile = false }) => {
  const horas = generarHoras();
  const slotHeight = isMobile 
    ? CALENDARIO_CONFIG.SLOT_HEIGHT * CALENDARIO_CONFIG.MOBILE_SCALE_FACTOR 
    : CALENDARIO_CONFIG.SLOT_HEIGHT;

  return (
    <div>
      {horas.map((hora, index) => (
        <div 
          key={hora} 
          className={`bg-gray-50 flex items-center justify-center ${isMobile ? 'text-xs' : 'text-xs'} text-gray-600`}
          style={{ height: `${slotHeight}rem` }}
        >
          {index % 2 === 0 && hora}
        </div>
      ))}
    </div>
  );
});

ColumnaHoras.displayName = 'ColumnaHoras';

export default ColumnaHoras;
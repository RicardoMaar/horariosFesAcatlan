import React from 'react';
import { CALENDARIO_CONFIG } from '../../constants/calendario';
import { generarHorasEnPunto, alturaHora, alturaTotal } from '../../utils/calendario';

const ColumnaHoras = React.memo(({ isMobile = false }) => {
  const horas = generarHorasEnPunto();
  const scaleFactor = isMobile ? CALENDARIO_CONFIG.MOBILE_SCALE_FACTOR : 1;
  const hora = alturaHora(scaleFactor);
  const total = alturaTotal(scaleFactor);

  return (
    <div
      className="relative"
      style={{ height: `${total}px`, background: 'var(--surface)' }}
    >
      {horas.map((label, index) => (
        <span
          key={label}
          className="absolute font-sans tabular-nums"
          style={{
            top: `${index * hora}px`,
            right: isMobile ? '6px' : '9px',
            transform: 'translateY(-50%)',
            fontSize: isMobile ? '10px' : '11px',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
});

ColumnaHoras.displayName = 'ColumnaHoras';

export default ColumnaHoras;

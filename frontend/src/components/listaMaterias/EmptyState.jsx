import React from 'react';

const EmptyState = React.memo(({ mensaje = 'No hay materias que coincidan con tu búsqueda.' }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12" style={{ color: 'var(--muted)' }}>
      <div
        className="flex items-center justify-center mb-3.5"
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          fontSize: '22px'
        }}
      >
        ✦
      </div>
      <p className="text-[13px] max-w-[220px] leading-relaxed">
        {mensaje}
      </p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;

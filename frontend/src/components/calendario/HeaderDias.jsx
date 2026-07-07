import React from 'react';

const HeaderDias = React.memo(({ dias, isMobile = false }) => {
  return (
    <>
      <div></div>
      {dias.map((dia) => (
        <div
          key={dia}
          className="text-center font-semibold"
          style={{
            padding: isMobile ? '2px 0 8px' : '4px 0 10px',
            fontSize: isMobile ? '11px' : '12px',
            color: 'var(--muted)',
            letterSpacing: '.02em'
          }}
        >
          {dia}
        </div>
      ))}
    </>
  );
});

HeaderDias.displayName = 'HeaderDias';

export default HeaderDias;

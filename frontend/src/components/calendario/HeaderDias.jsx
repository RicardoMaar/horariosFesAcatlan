import React from 'react';

const HeaderDias = React.memo(({ dias, isMobile = false }) => {
  return (
    <>
      <div className="bg-gray-50 p-1"></div>
      {dias.map((dia) => (
        <div key={dia} className="bg-gray-50 p-1 text-center">
          <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{dia}</div>
        </div>
      ))}
    </>
  );
});

HeaderDias.displayName = 'HeaderDias';

export default HeaderDias;
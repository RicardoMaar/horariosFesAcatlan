import React from 'react';

const EmptyState = React.memo(() => {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 text-sm">
        No se encontraron materias
      </p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
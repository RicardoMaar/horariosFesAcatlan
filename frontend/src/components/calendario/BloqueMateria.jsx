import React from 'react';
import { CLASES_ANIMACION } from '../../constants/calendario';

const BloqueMateria = React.memo(({
  bloque,
  scaleFactor = 1,
  isMobile = false,
  esNuevo,
  seEstaQuitando,
  esBloqueDelModal,
  onBloqueClick,
  onRemove
}) => {
  const width = bloque.totalColumnas > 1 
    ? `${100 / bloque.totalColumnas}%` 
    : '100%';
  
  const left = bloque.totalColumnas > 1 
    ? `${(100 / bloque.totalColumnas) * bloque.columna}%` 
    : '0';

  const handleRemove = (event) => {
    event.stopPropagation();
    onRemove(bloque);
  };

  // Calcular opacidad
  let opacidadFinal;
  if (seEstaQuitando) {
    opacidadFinal = 0;
  } else if (esBloqueDelModal) {
    opacidadFinal = 0.3;
  } else if (bloque.tieneTraslape) {
    opacidadFinal = 0.5;
  } else {
    opacidadFinal = 1;
  }

  // Construir clases de animación
  let claseAnimacion = CLASES_ANIMACION.BASE;
  if (esNuevo) {
    claseAnimacion += ` ${CLASES_ANIMACION.ENTRADA}`;
  }
  if (seEstaQuitando) {
    claseAnimacion += ` ${CLASES_ANIMACION.SALIDA}`;
  }
  if (esBloqueDelModal && !seEstaQuitando && !esNuevo) {
    claseAnimacion += ` ${CLASES_ANIMACION.MODAL_ACTIVO}`;
  }
  if (bloque.tieneTraslape && !esBloqueDelModal && !seEstaQuitando && !esNuevo) {
    claseAnimacion += ` ${CLASES_ANIMACION.TRASLAPE}`;
  }

  const handleClick = () => {
    if (!esBloqueDelModal && !seEstaQuitando) {
      onBloqueClick(bloque);
    }
  };

  return (
    <div
      className={`
        group absolute ${isMobile ? 'p-0.5' : 'p-1'} rounded cursor-pointer
        ${claseAnimacion}
        ${bloque.tieneTraslape && !seEstaQuitando ? 'ring-2 ring-red-500 ring-opacity-10' : ''}
      `}
      style={{
        top: `${(bloque.top * scaleFactor) / 16}rem`,
        height: `${((bloque.height - 2) * scaleFactor) / 16}rem`,
        backgroundColor: bloque.color,
        left,
        width,
        opacity: opacidadFinal,
        zIndex: esBloqueDelModal ? 5 : (esNuevo ? 15 : 'auto'),
        pointerEvents: seEstaQuitando ? 'none' : 'auto'
      }}
      onClick={handleClick}
    >
      {!seEstaQuitando && !esBloqueDelModal && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-1 right-1 h-4 w-4 rounded-full bg-white/90 text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Quitar ${bloque.nombre}`}
        >
          ×
        </button>
      )}
      <div className="text-white h-full flex flex-col justify-center px-1 overflow-hidden"> 
        <div 
          className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold leading-tight`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {bloque.nombre}
        </div>
        {bloque.height > 60 && !isMobile && (
          <div className="text-[10px] opacity-80 truncate mt-1">
            {bloque.profesor}
          </div>
        )}
      </div>
    </div>
  );
});

BloqueMateria.displayName = 'BloqueMateria';

export default BloqueMateria;

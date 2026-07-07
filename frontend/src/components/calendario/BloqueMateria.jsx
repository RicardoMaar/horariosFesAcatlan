import React from 'react';
import { CLASES_ANIMACION } from '../../constants/calendario';
import { getVariante } from '../../utils/colores';
import useTheme from '../../store/useTheme';

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
  const dark = useTheme(state => state.dark);
  const variante = getVariante(bloque.color, dark);

  const width = bloque.totalColumnas > 1
    ? `calc(${100 / bloque.totalColumnas}% - 4px)`
    : 'calc(100% - 4px)';

  const left = bloque.totalColumnas > 1
    ? `calc(${(100 / bloque.totalColumnas) * bloque.columna}% + 2px)`
    : '2px';

  const top = bloque.top * scaleFactor;
  const height = Math.max(bloque.height * scaleFactor - 3, 16);

  const handleRemove = (event) => {
    event.stopPropagation();
    onRemove(bloque);
  };

  // Opacidad: se atenúa solo el bloque activo del modal (para resaltar la selección).
  let opacidadFinal = 1;
  if (seEstaQuitando) {
    opacidadFinal = 0;
  } else if (esBloqueDelModal) {
    opacidadFinal = 0.35;
  }

  // Clases de animación (se conservan intactas).
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

  // Anillo rojo cuando hay traslape; sombra suave normal.
  const boxShadow = bloque.tieneTraslape && !seEstaQuitando
    ? '0 0 0 1.5px var(--danger), 0 1px 3px rgba(0,0,0,.12)'
    : '0 1px 3px rgba(0,0,0,.08)';

  const handleClick = () => {
    if (!esBloqueDelModal && !seEstaQuitando) {
      onBloqueClick(bloque);
    }
  };

  const mostrarSub = height >= 42 && !isMobile;

  return (
    <div
      className={`group absolute overflow-hidden cursor-pointer ${claseAnimacion}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left,
        width,
        background: variante.fill,
        color: variante.text,
        borderLeft: `3px solid ${variante.bar}`,
        borderRadius: '8px',
        padding: isMobile ? '4px 6px' : '5px 8px',
        boxShadow,
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
          className="absolute top-[3px] right-[3px] h-4 w-4 rounded-full flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: dark ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.85)',
            color: variante.text
          }}
          aria-label={`Quitar ${bloque.nombre}`}
        >
          ×
        </button>
      )}
      <div
        className="font-semibold leading-tight"
        style={{
          fontSize: isMobile ? '10.5px' : '11.5px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {bloque.nombre}
      </div>
      {mostrarSub && (
        <div
          className="truncate"
          style={{ fontSize: '10px', opacity: 0.82, marginTop: '3px' }}
        >
          {bloque.horario.inicio}–{bloque.horario.fin} · {bloque.salon}
        </div>
      )}
    </div>
  );
});

BloqueMateria.displayName = 'BloqueMateria';

export default BloqueMateria;

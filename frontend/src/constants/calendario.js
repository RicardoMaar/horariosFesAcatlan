export const CALENDARIO_CONFIG = {
    DIAS: ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'],
    DIAS_NOMBRES: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    HORA_INICIO: 7,
    HORA_FIN: 23,
    // Altura de cada hora en px (una línea fuerte por hora, una tenue en la media).
    PX_POR_HORA: 54,
    MOBILE_SCALE_FACTOR: 0.875,
    MOBILE_BREAKPOINT: 768,
    SWIPE_THRESHOLD: 50,
    ANIMATION_DELAYS: {
      ENTRADA: 500,
      SALIDA: 400,
      RENDER_DOM: 200
    }
  };

  export const CLASES_ANIMACION = {
    BASE: 'calendario-bloque-hover',
    ENTRADA: 'calendario-bloque',
    SALIDA: 'calendario-bloque-exit',
    MODAL_ACTIVO: 'calendario-bloque-modal-activo',
    TRASLAPE: 'calendario-bloque-traslape',
    STAGGER: (index) => `calendario-stagger-${(index % 5) + 1}`
  };

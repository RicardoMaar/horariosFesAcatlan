export const SEMESTRE_LABELS = {
    '40': 'Optativas',
    '00': 'Sin semestre'
  };
  
  export const ANIMATION_CONFIG = {
    ITEM_DELAY: 50, // ms entre items
    GRUPO_DELAY: 30, // ms entre grupos
    TRANSITION_DURATION: '300ms',
    ITEM_TRANSITION: 'all 0.2s ease-out',
    EXPAND_TRANSITION: 'all 0.3s ease-in-out'
  };
  
  export const getSemestreLabel = (semestre) => {
    if (SEMESTRE_LABELS[semestre]) {
      return SEMESTRE_LABELS[semestre];
    }
    return `${semestre}° Semestre`;
  };
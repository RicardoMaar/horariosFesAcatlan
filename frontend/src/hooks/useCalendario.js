import { useState, useEffect, useRef, useMemo } from 'react';
import useHorariosStore from '../store/useHorariosStore';
import { getMateriasConTraslapes } from '../utils/traslapes';
import { calcularPosicionBloque, organizarBloquesPorColumnas } from '../utils/calendario';
import { CALENDARIO_CONFIG } from '../constants/calendario';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= CALENDARIO_CONFIG.MOBILE_BREAKPOINT);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
}

export function useSwipeNavigation(initialView = 0) {
  const [currentView, setCurrentView] = useState(initialView);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsProcessing(false);
  };

  const handleTouchEnd = (e) => {
    // Evitar procesamiento si ya está en proceso
    if (isProcessing) {
      return;
    }

    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;

    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    // Definir umbral mínimo para swipe
    const minSwipeDistance = CALENDARIO_CONFIG.SWIPE_THRESHOLD || 50;
    
    // Solo procesar si:
    // 1. El movimiento horizontal es mayor que el vertical
    // 2. La distancia es suficiente
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isSufficientDistance = Math.abs(deltaX) > minSwipeDistance;
    
    if (isHorizontalSwipe && isSufficientDistance) {
      setIsProcessing(true);
      
      if (deltaX > 0 && currentView === 0) {
        // Swipe hacia la izquierda desde vista 0 (ir a vista 1)
        // console.log('Swipe válido: LU-MA-MI → JU-VI-SA');
        setCurrentView(1);
      } else if (deltaX < 0 && currentView === 1) {
        // Swipe hacia la derecha desde vista 1 (ir a vista 0)
        // console.log('Swipe válido: JU-VI-SA → LU-MA-MI');
        setCurrentView(0);
      }

      // Resetear el estado de procesamiento después de la animación
      setTimeout(() => {
        setIsProcessing(false);
      }, 400); // Un poco más que la duración de la transición CSS (300ms)
    }
  };

  return {
    currentView,
    setCurrentView,
    handleTouchStart,
    handleTouchEnd
  };
}

export function useAnimacionesBloque(materiasSeleccionadas) {
  const [bloquesAnimando, setBloquesAnimando] = useState(new Set());
  const [bloquesParaQuitar, setBloquesParaQuitar] = useState(new Set());
  const [bloquesFantasma, setBloquesFantasma] = useState([]);
  const prevMateriasRef = useRef([]);
  const prevOpcionRef = useRef(null);
  const opcionActivaId = useHorariosStore(state => state.opcionActivaId);

  useEffect(() => {
    if (prevOpcionRef.current === null) {
      prevOpcionRef.current = opcionActivaId;
    }
    if (prevOpcionRef.current !== opcionActivaId) {
      prevOpcionRef.current = opcionActivaId;
      prevMateriasRef.current = materiasSeleccionadas;
      setBloquesAnimando(new Set());
      setBloquesParaQuitar(new Set());
      setBloquesFantasma([]);
      return;
    }

    const materiasActuales = materiasSeleccionadas;
    const materiasAnteriores = prevMateriasRef.current;

    // Detectar materias nuevas
    const materiasNuevas = materiasActuales.filter(
      materia => !materiasAnteriores.some(prev => prev.id === materia.id)
    );

    // Detectar materias quitadas
    const materiasQuitadas = materiasAnteriores.filter(
      materia => !materiasActuales.some(actual => actual.id === materia.id)
    );

    if (materiasNuevas.length > 0) {
      const nuevosIds = new Set();
      materiasNuevas.forEach(materia => {
        materia.horarios.forEach((_, index) => {
          nuevosIds.add(`${materia.id}-${index}`);
        });
      });
      
      setBloquesAnimando(nuevosIds);
      
      setTimeout(() => {
        setBloquesAnimando(new Set());
      }, CALENDARIO_CONFIG.ANIMATION_DELAYS.ENTRADA);
    }

    if (materiasQuitadas.length > 0) {
      setBloquesFantasma(materiasQuitadas);
      
      const quitadosIds = new Set();
      materiasQuitadas.forEach(materia => {
        materia.horarios.forEach((_, index) => {
          quitadosIds.add(`${materia.id}-${index}`);
        });
      });
      
      setBloquesParaQuitar(quitadosIds);
      
      setTimeout(() => {
        setBloquesParaQuitar(new Set());
        setBloquesFantasma([]);
      }, CALENDARIO_CONFIG.ANIMATION_DELAYS.SALIDA);
    }

    prevMateriasRef.current = materiasActuales;
  }, [materiasSeleccionadas, opcionActivaId]);

  return {
    bloquesAnimando,
    bloquesParaQuitar,
    bloquesFantasma
  };
}

export function useBloquesPorDia() {
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const { bloquesFantasma } = useAnimacionesBloque(materiasSeleccionadas);
  const traslapes = useMemo(() => getMateriasConTraslapes(materiasSeleccionadas), [materiasSeleccionadas]);

  return useMemo(() => {
    const bloques = {};
    
    CALENDARIO_CONFIG.DIAS.forEach(dia => {
      bloques[dia] = [];
    });
    
    const todasLasMaterias = [...materiasSeleccionadas, ...bloquesFantasma];
    
    todasLasMaterias.forEach(materia => {
      materia.horarios.forEach(horario => {
        if (CALENDARIO_CONFIG.DIAS.includes(horario.dia)) {
          const { top, height } = calcularPosicionBloque(horario);
          
          bloques[horario.dia].push({
            ...materia,
            horario,
            top,
            height,
            color: coloresAsignados[materia.id],
            tieneTraslape: traslapes.has(materia.id),
            esFantasma: bloquesFantasma.some(f => f.id === materia.id)
          });
        }
      });
    });

    // Organizar bloques por columnas para evitar sobreposición visual
    Object.keys(bloques).forEach(dia => {
      organizarBloquesPorColumnas(bloques[dia]);
    });

    return bloques;
  }, [materiasSeleccionadas, coloresAsignados, traslapes, bloquesFantasma]);
}

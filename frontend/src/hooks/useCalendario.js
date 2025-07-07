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

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > CALENDARIO_CONFIG.SWIPE_THRESHOLD) {
      if (diff > 0 && currentView === 0) {
        setCurrentView(1); // Swipe izquierda
      } else if (diff < 0 && currentView === 1) {
        setCurrentView(0); // Swipe derecha
      }
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

  useEffect(() => {
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
  }, [materiasSeleccionadas]);

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
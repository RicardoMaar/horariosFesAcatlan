import { useMemo, useState, useEffect, useRef } from 'react';
import useHorariosStore from '../store/useHorariosStore';
import { getMateriasConTraslapes, horaAMinutos } from '../utils/traslapes';
import '../styles/animations.css';

const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sabado'];
const HORA_INICIO = 7;
const HORA_FIN = 23;
const SLOT_HEIGHT = 1.1375; // rem por cada 30 minutos (18.2px / 16 = 1.1375rem)

function CalendarioSemanal() {
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const abrirModal = useHorariosStore(state => state.abrirModal);

  const modalAbierto = useHorariosStore(state => state.modalAbierto);
  const bloqueModalActivo = useHorariosStore(state => state.bloqueModalActivo);

  // Estados para móvil
  const [currentView, setCurrentView] = useState(0); // 0 = Lun-Mie, 1 = Jue-Sáb
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  // 👈 MODIFICAR: Estados para animaciones
  const [bloquesAnimando, setBloquesAnimando] = useState(new Set());
  const [bloquesParaQuitar, setBloquesParaQuitar] = useState(new Set());
  const [bloquesFantasma, setBloquesFantasma] = useState([]); // 👈 NUEVO: Para mantener bloques durante animación
  const prevMateriasRef = useRef([]);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 👈 MODIFICAR: Detectar cambios en materias para animar
  useEffect(() => {
    const materiasActuales = materiasSeleccionadas;
    const materiasAnteriores = prevMateriasRef.current;

    // Detectar materias nuevas (para animar entrada)
    const materiasNuevas = materiasActuales.filter(
      materia => !materiasAnteriores.some(prev => prev.id === materia.id)
    );

    // Detectar materias quitadas (para animar salida)
    const materiasQuitadas = materiasAnteriores.filter(
      materia => !materiasActuales.some(actual => actual.id === materia.id)
    );

    if (materiasNuevas.length > 0) {
      // Marcar bloques nuevos para animación
      const nuevosIds = new Set();
      materiasNuevas.forEach(materia => {
        materia.horarios.forEach((_, index) => {
          nuevosIds.add(`${materia.id}-${index}`);
        });
      });
      
      setBloquesAnimando(nuevosIds);
      
      // Quitar la marca después de la animación
      setTimeout(() => {
        setBloquesAnimando(new Set());
      }, 500);
    }

    if (materiasQuitadas.length > 0) {
      // 👈 MODIFICAR: Guardar materias quitadas como fantasma
      setBloquesFantasma(materiasQuitadas);
      
      // Marcar bloques para quitar
      const quitadosIds = new Set();
      materiasQuitadas.forEach(materia => {
        materia.horarios.forEach((_, index) => {
          quitadosIds.add(`${materia.id}-${index}`);
        });
      });
      
      setBloquesParaQuitar(quitadosIds);
      
      // 👈 MODIFICAR: Limpiar después de la animación
      setTimeout(() => {
        setBloquesParaQuitar(new Set());
        setBloquesFantasma([]); // Quitar bloques fantasma
      }, 400); // Aumentar tiempo para que complete la animación
    }

    prevMateriasRef.current = materiasActuales;
  }, [materiasSeleccionadas]);

  // Código temporal para debugging - agregar en tu componente del calendario
  useEffect(() => {
    console.log('Elementos del DOM:', {
      overflowAuto: document.querySelector('.overflow-x-auto'),
      tables: document.querySelectorAll('table'),
      grids: document.querySelectorAll('.grid'),
      calendars: document.querySelectorAll('[class*="calendar"]'),
      schedules: document.querySelectorAll('[class*="schedule"]'),
      horarios: document.querySelectorAll('[class*="horario"]')
    });
  }, []);

  // Detectar traslapes
  const traslapes = useMemo(() => {
    return getMateriasConTraslapes(materiasSeleccionadas);
  }, [materiasSeleccionadas]);

  // Generar array de horas
  const horas = useMemo(() => {
    const result = [];
    for (let h = HORA_INICIO; h < HORA_FIN; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
      result.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return result;
  }, []);

  // 👈 MODIFICAR: Calcular posición y altura de cada bloque (incluir fantasmas)
  const bloquesPorDia = useMemo(() => {
    const bloques = {};
    
    DIAS.forEach(dia => {
      bloques[dia] = [];
    });
    
    // 👈 AGREGAR: Combinar materias actuales con fantasmas
    const todasLasMaterias = [...materiasSeleccionadas, ...bloquesFantasma];
    
    todasLasMaterias.forEach(materia => {
      materia.horarios.forEach(horario => {
        if (DIAS.includes(horario.dia)) {
          const [horaInicio, minInicio] = horario.inicio.split(':').map(Number);
          const [horaFin, minFin] = horario.fin.split(':').map(Number);
          
          const minutosInicio = (horaInicio - HORA_INICIO) * 60 + minInicio;
          const minutosFin = (horaFin - HORA_INICIO) * 60 + minFin;
          
          const top = (minutosInicio / 30) * SLOT_HEIGHT * 16;
          const height = ((minutosFin - minutosInicio) / 30) * SLOT_HEIGHT * 16;
          
          bloques[horario.dia].push({
            ...materia,
            horario,
            top,
            height,
            color: coloresAsignados[materia.id],
            tieneTraslape: traslapes.has(materia.id),
            esFantasma: bloquesFantasma.some(f => f.id === materia.id) // 👈 NUEVO: Marcar fantasmas
          });
        }
      });
    });

    // Detectar y ajustar bloques que se sobrelapan en el mismo día
    Object.keys(bloques).forEach(dia => {

      const bloquesDelDia = bloques[dia];
      
      // Ordenar por hora de inicio
      bloquesDelDia.sort((a, b) => {
        const aInicio = horaAMinutos(a.horario.inicio);
        const bInicio = horaAMinutos(b.horario.inicio);
        return aInicio - bInicio;
      });

      // Crear grupos de bloques que se traslapan entre sí
      const grupos = [];
      bloquesDelDia.forEach(bloque => {
        const bloqueInicio = horaAMinutos(bloque.horario.inicio);
        const bloqueFin = horaAMinutos(bloque.horario.fin);
        
        // Buscar un grupo existente donde este bloque traslape
        let grupoEncontrado = false;
        for (const grupo of grupos) {
          // Verificar si traslapa con algún bloque del grupo
          const traslapaConGrupo = grupo.some(b => {
            const bInicio = horaAMinutos(b.horario.inicio);
            const bFin = horaAMinutos(b.horario.fin);
            return bloqueInicio < bFin && bInicio < bloqueFin;
          });
          // si traslapa con el grupo, agregarlo al grupo
          if (traslapaConGrupo) {
            grupo.push(bloque);
            grupoEncontrado = true;
            break;
          }
        }
        
        // Si no encontró grupo, crear uno nuevo
        if (!grupoEncontrado) {
          grupos.push([bloque]);
        }
      });

      // Asignar columnas dentro de cada grupo
      grupos.forEach(grupo => {
        // Ordenar grupo por hora de inicio
        grupo.sort((a, b) => {
          const aInicio = horaAMinutos(a.horario.inicio);
          const bInicio = horaAMinutos(b.horario.inicio);
          return aInicio - bInicio;
        });

        // Asignar columnas solo dentro del grupo
        grupo.forEach((bloque, index) => {
          let columna = 0;
          const bloqueInicio = horaAMinutos(bloque.horario.inicio);
          const bloqueFin = horaAMinutos(bloque.horario.fin);

          // Verificar contra bloques anteriores del mismo grupo
          for (let i = 0; i < index; i++) {
            const otroBloque = grupo[i];
            const otroInicio = horaAMinutos(otroBloque.horario.inicio);
            const otroFin = horaAMinutos(otroBloque.horario.fin);

            // Si hay sobreposición temporal y misma columna
            if (bloqueInicio < otroFin && otroInicio < bloqueFin) {
              if (otroBloque.columna === columna) {
                columna++;
              }
            }
          }

          bloque.columna = columna;
          bloque.totalColumnas = Math.max(...grupo.map(b => b.columna || 0)) + 1;
        });
      });
    });

    return bloques;
  }, [materiasSeleccionadas, coloresAsignados, traslapes, bloquesFantasma]); // 👈 AGREGAR: bloquesFantasma como dependencia

  // Funciones para manejar swipe
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) { // Umbral de 50px
      if (diff > 0 && currentView === 0) {
        setCurrentView(1); // Swipe izquierda - mostrar Jue-Sáb
      } else if (diff < 0 && currentView === 1) {
        setCurrentView(0); // Swipe derecha - mostrar Lun-Mie
      }
    }
  };

  // 👈 MODIFICAR: Función para renderizar el grid de días
  const renderDiasGrid = (diasParaMostrar) => {
    return (
      <>
        {/* Columnas de días */}
        {diasParaMostrar.map(dia => (
          <div key={dia} className="relative bg-white">
            {/* Líneas de fondo para las horas */}
            {horas.map((_, index) => (
              <div 
                key={index}
                className={`border-t ${index % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                style={{ height: isMobile ? `${SLOT_HEIGHT * 0.875}rem` : `${SLOT_HEIGHT}rem` }}
              />
            ))}

            {/* Bloques de materias */}
            {bloquesPorDia[dia].map((bloque, index) => {
              const width = bloque.totalColumnas > 1 
                ? `${100 / bloque.totalColumnas}%` 
                : '100%';
              const left = bloque.totalColumnas > 1 
                ? `${(100 / (bloque.totalColumnas)) * bloque.columna}%` 
                : '0';

              // Verificar si es el bloque del modal activo
              const esBloqueDelModal = modalAbierto && 
                bloqueModalActivo?.id === bloque.id && 
                bloqueModalActivo?.horario?.dia === bloque.horario.dia &&
                bloqueModalActivo?.horario?.inicio === bloque.horario.inicio;
              
              const scaleFactor = isMobile ? 0.875 : 1;

              // 👈 MODIFICAR: Lógica de animación
              const bloqueKey = `${bloque.id}-${index}`;
              const esNuevo = bloquesAnimando.has(bloqueKey);
              const seEstaQuitando = bloquesParaQuitar.has(bloqueKey) || bloque.esFantasma; // 👈 MODIFICAR
              
              // 👈 MODIFICAR: Opacidad basada en estado
              let opacidadFinal;
              if (seEstaQuitando) {
                opacidadFinal = 0; // Se está quitando
              } else if (esBloqueDelModal) {
                opacidadFinal = 0.3; // Modal activo
              } else if (bloque.tieneTraslape) {
                opacidadFinal = 0.5; // Traslape
              } else {
                opacidadFinal = 1; // Normal
              }

              // Clases de animación
              let claseAnimacion = 'calendario-bloque-hover';
              if (esNuevo) {
                claseAnimacion += ` calendario-bloque calendario-stagger-${(index % 5) + 1}`;
              }
              if (seEstaQuitando) {
                claseAnimacion += ' calendario-bloque-exit';
              }
              if (esBloqueDelModal && !seEstaQuitando) {
                claseAnimacion += ' calendario-bloque-modal-activo';
              }
              if (bloque.tieneTraslape && !esBloqueDelModal && !seEstaQuitando) {
                claseAnimacion += ' calendario-bloque-traslape';
              }

              return (
                <div
                  key={bloqueKey}
                  className={`
                    absolute ${isMobile ? 'p-0.5' : 'p-1'} rounded cursor-pointer
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
                    pointerEvents: seEstaQuitando ? 'none' : 'auto' // 👈 NUEVO: Deshabilitar clicks en fantasmas
                  }}
                  onClick={() => !esBloqueDelModal && !seEstaQuitando && abrirModal(bloque)}
                >
                  <div className="text-white h-full flex flex-col justify-center px-1 overflow-hidden"> 
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold truncate`}>
                      {bloque.nombre}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-90 truncate`}>
                      {bloque.grupo}
                    </div>
                    {bloque.height > 60 && !isMobile && (
                      <div className="text-xs opacity-80 truncate mt-0.5">
                        {bloque.profesor}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </>
    );
  };

  // Vista móvil
  if (isMobile) {
    const diasView1 = DIAS.slice(0, 3); // LU, MA, MI
    const diasView2 = DIAS.slice(3, 6); // JU, VI, SA
    const nombresView1 = DIAS_NOMBRES.slice(0, 3);
    const nombresView2 = DIAS_NOMBRES.slice(3, 6);

    return (
      <div className="w-full">
        <div 
          className="calendar-swipe-container"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="calendar-views-wrapper"
            style={{ transform: `translateX(-${currentView * 100}%)` }}
          >
            {/* Vista 1: Lun-Mie */}
            <div className="calendar-view">
              {/* Header con días */}
              <div className="grid grid-cols-[3.125rem,repeat(3,1fr)] gap-px bg-gray-200 mb-px">
                <div className="bg-gray-50 p-1"></div>
                {nombresView1.map((dia) => (
                  <div key={dia} className="bg-gray-50 p-1 text-center">
                    <div className="font-medium text-xs">{dia}</div>
                  </div>
                ))}
              </div>
              
              {/* Grid del calendario */}
              <div className="relative">
                <div className="grid grid-cols-[3.125rem,repeat(3,1fr)] gap-px bg-gray-200">
                  {/* Columna de horas */}
                  <div>
                    {horas.map((hora, index) => (
                      <div 
                        key={hora} 
                        className="bg-gray-50 flex items-center justify-center text-xs text-gray-600"
                        style={{ height: `${SLOT_HEIGHT * 0.875}rem` }}
                      >
                        {index % 2 === 0 && hora}
                      </div>
                    ))}
                  </div>
                  {renderDiasGrid(diasView1, nombresView1)}
                </div>
              </div>
            </div>

            {/* Vista 2: Jue-Sáb */}
            <div className="calendar-view">
              {/* Header con días */}
              <div className="grid grid-cols-[3.125rem,repeat(3,1fr)] gap-px bg-gray-200 mb-px">
                <div className="bg-gray-50 p-1"></div>
                {nombresView2.map((dia) => (
                  <div key={dia} className="bg-gray-50 p-1 text-center">
                    <div className="font-medium text-xs">{dia}</div>
                  </div>
                ))}
              </div>
              
              {/* Grid del calendario */}
              <div className="relative">
                <div className="grid grid-cols-[3.125rem,repeat(3,1fr)] gap-px bg-gray-200">
                  {/* Columna de horas */}
                  <div>
                    {horas.map((hora, index) => (
                      <div 
                        key={hora} 
                        className="bg-gray-50 flex items-center justify-center text-xs text-gray-600"
                        style={{ height: `${SLOT_HEIGHT * 0.875}rem` }}
                      >
                        {index % 2 === 0 && hora}
                      </div>
                    ))}
                  </div>
                  {renderDiasGrid(diasView2, nombresView2)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Indicadores de página */}
        <div className="calendar-dots">
          <div className={`calendar-dot ${currentView === 0 ? 'active' : ''}`}></div>
          <div className={`calendar-dot ${currentView === 1 ? 'active' : ''}`}></div>
        </div>
      </div>
    );
  }

  // Vista desktop (tu código original)
  return (
    <div>
      <div className="w-full lg:min-w-[37.5rem]">
        {/* Header con días */}
        <div className="grid grid-cols-[5rem,repeat(6,1fr)] gap-px bg-gray-200 mb-px">
          <div className="bg-gray-50 p-2"></div>
          {DIAS_NOMBRES.map((dia) => (
            <div key={dia} className="bg-gray-50 p-2 text-center">
              <div className="font-medium text-sm">{dia}</div>
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div className="relative">
          <div className="grid grid-cols-[5rem,repeat(6,1fr)] gap-px bg-gray-200">
            {/* Columna de horas */}
            <div>
              {horas.map((hora, index) => (
                <div 
                  key={hora} 
                  className="bg-gray-50 h-10 flex items-center justify-center text-xs text-gray-600"
                  style={{ height: `${SLOT_HEIGHT}rem` }}
                >
                  {index % 2 === 0 && hora}
                </div>
              ))}
            </div>
            {renderDiasGrid(DIAS, DIAS_NOMBRES)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarioSemanal;
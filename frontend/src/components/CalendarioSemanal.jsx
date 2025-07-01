import { useMemo, useState, useEffect } from 'react';
import useHorariosStore from '../store/useHorariosStore';

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

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detectar traslapes
  // Esta seccion es para agregar bordes rojos en el grid (creo)
  const traslapes = useMemo(() => {
    const traslapesSet = new Set();
    
    for (let i = 0; i < materiasSeleccionadas.length; i++) {
      for (let j = i + 1; j < materiasSeleccionadas.length; j++) {
        if (hayTraslape(materiasSeleccionadas[i], materiasSeleccionadas[j])) {
          traslapesSet.add(materiasSeleccionadas[i].id);
          traslapesSet.add(materiasSeleccionadas[j].id);
        }
      }
    }
    
    return traslapesSet;
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

  // Calcular posición y altura de cada bloque
  const bloquesPorDia = useMemo(() => {
    const bloques = {};
    
    DIAS.forEach(dia => {
      bloques[dia] = [];
    });
    
    materiasSeleccionadas.forEach(materia => {
      materia.horarios.forEach(horario => {
        if (DIAS.includes(horario.dia)) {
          const [horaInicio, minInicio] = horario.inicio.split(':').map(Number);
          const [horaFin, minFin] = horario.fin.split(':').map(Number);
          
          const minutosInicio = (horaInicio - HORA_INICIO) * 60 + minInicio;
          const minutosFin = (horaFin - HORA_INICIO) * 60 + minFin;
          
          const top = (minutosInicio / 30) * SLOT_HEIGHT * 16; // Convertir rem a px
          const height = ((minutosFin - minutosInicio) / 30) * SLOT_HEIGHT * 16; // Convertir rem a px
          
          bloques[horario.dia].push({
            ...materia,
            horario,
            top,
            height,
            color: coloresAsignados[materia.id],
            tieneTraslape: traslapes.has(materia.id)
          });
        }
      });
    });

    // Detectar y ajustar bloques que se sobrelapan en el mismo día
    Object.keys(bloques).forEach(dia => {

      const bloquesDelDia = bloques[dia];
      
      // Ordenar por hora de inicio
      bloquesDelDia.sort((a, b) => {
        const aInicio = timeToMinutes(a.horario.inicio);
        const bInicio = timeToMinutes(b.horario.inicio);
        return aInicio - bInicio;
      });

      // Crear grupos de bloques que se traslapan entre sí
      const grupos = [];
      bloquesDelDia.forEach(bloque => {
        const bloqueInicio = timeToMinutes(bloque.horario.inicio);
        const bloqueFin = timeToMinutes(bloque.horario.fin);
        
        // Buscar un grupo existente donde este bloque traslape
        let grupoEncontrado = false;
        for (const grupo of grupos) {
          // Verificar si traslapa con algún bloque del grupo
          const traslapaConGrupo = grupo.some(b => {
            const bInicio = timeToMinutes(b.horario.inicio);
            const bFin = timeToMinutes(b.horario.fin);
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
          const aInicio = timeToMinutes(a.horario.inicio);
          const bInicio = timeToMinutes(b.horario.inicio);
          return aInicio - bInicio;
        });

        // Asignar columnas solo dentro del grupo
        grupo.forEach((bloque, index) => {
          let columna = 0;
          const bloqueInicio = timeToMinutes(bloque.horario.inicio);
          const bloqueFin = timeToMinutes(bloque.horario.fin);

          // Verificar contra bloques anteriores del mismo grupo
          for (let i = 0; i < index; i++) {
            const otroBloque = grupo[i];
            const otroInicio = timeToMinutes(otroBloque.horario.inicio);
            const otroFin = timeToMinutes(otroBloque.horario.fin);

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
  }, [materiasSeleccionadas, coloresAsignados, traslapes]);

  function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function hayTraslape(materia1, materia2) {
    for (const h1 of materia1.horarios) {
      for (const h2 of materia2.horarios) {
        if (h1.dia === h2.dia) {
          const inicio1 = timeToMinutes(h1.inicio);
          const fin1 = timeToMinutes(h1.fin);
          const inicio2 = timeToMinutes(h2.inicio);
          const fin2 = timeToMinutes(h2.fin);
          
          if (inicio1 < fin2 && inicio2 < fin1) {
            return true;
          }
        }
      }
    }
    return false;
  }

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

  // Función para renderizar el grid de días (reutilizable)
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
              
              const opacidadFinal = esBloqueDelModal ? 0.3 : (bloque.tieneTraslape ? 0.5 : 1);

              const scaleFactor = isMobile ? 0.875 : 1;

              return (
                <div
                  key={`${bloque.id}-${index}`}
                  className={`
                    absolute ${isMobile ? 'p-0.5' : 'p-1'} rounded cursor-pointer transition-all duration-200
                    ${!esBloqueDelModal ? (isMobile ? 'hover:shadow-md hover:z-10' : 'hover:shadow-lg hover:z-10 hover:scale-105') : 'z-0'}
                    ${bloque.tieneTraslape ? 'ring-2 ring-red-500 ring-opacity-10' : ''}
                  `}
                  style={{
                    top: `${(bloque.top * scaleFactor) / 16}rem`,
                    height: `${((bloque.height - 2) * scaleFactor) / 16}rem`,
                    backgroundColor: bloque.color,
                    left,
                    width,
                    opacity: opacidadFinal,
                    zIndex: esBloqueDelModal ? .5 : 'auto'
                  }}
                  onClick={() => !esBloqueDelModal && abrirModal(bloque)}
                >
                  <div className="text-white h-full flex flex-col justify-center px-1 overflow-hidden"> 
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold truncate`}>
                      {bloque.nombre}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} opacity-90 truncate`}>
                      {bloque.grupo}
                    </div>
                    {bloque.height > 60 && !isMobile && (
                      <>
                        <div className="text-xs opacity-80 truncate mt-0.5">
                          {bloque.profesor}
                        </div>
                      </>
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
      <div className="min-w-[37.5rem]">
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
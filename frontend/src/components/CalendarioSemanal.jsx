import { useMemo } from 'react';
import useHorariosStore from '../store/useHorariosStore';

const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI'];
const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORA_INICIO = 7;
const HORA_FIN = 22;
const SLOT_HEIGHT = 40; // px por cada 30 minutos

function CalendarioSemanal() {
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const traslapes = useHorariosStore(state => state.getMateriasConTraslape());
  const abrirModal = useHorariosStore(state => state.abrirModal);

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
          
          const top = (minutosInicio / 30) * SLOT_HEIGHT;
          const height = ((minutosFin - minutosInicio) / 30) * SLOT_HEIGHT;
          
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

      // Asignar columnas para evitar sobreposición visual
      bloquesDelDia.forEach((bloque, index) => {
        let columna = 0;
        const bloqueInicio = timeToMinutes(bloque.horario.inicio);
        const bloqueFin = timeToMinutes(bloque.horario.fin);

        // Verificar contra bloques anteriores
        for (let i = 0; i < index; i++) {
          const otroBloque = bloquesDelDia[i];
          const otroInicio = timeToMinutes(otroBloque.horario.inicio);
          const otroFin = timeToMinutes(otroBloque.horario.fin);

          // Si hay sobreposición temporal
          if (bloqueInicio < otroFin && otroInicio < bloqueFin) {
            if (otroBloque.columna === columna) {
              columna++;
            }
          }
        }

        bloque.columna = columna;
        bloque.totalColumnas = Math.max(...bloquesDelDia.map(b => b.columna || 0)) + 1;
      });
    });

    return bloques;
  }, [materiasSeleccionadas, coloresAsignados, traslapes]);

  function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header con días */}
        <div className="grid grid-cols-[80px,repeat(5,1fr)] gap-px bg-gray-200 mb-px">
          <div className="bg-gray-50 p-2"></div>
          {DIAS_NOMBRES.map((dia, index) => (
            <div key={dia} className="bg-gray-50 p-2 text-center">
              <div className="font-medium text-sm">{dia}</div>
              <div className="text-xs text-gray-500 font-handwritten">{DIAS[index]}</div>
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div className="relative">
          <div className="grid grid-cols-[80px,repeat(5,1fr)] gap-px bg-gray-200">
            {/* Columna de horas */}
            <div>
              {horas.map((hora, index) => (
                <div 
                  key={hora} 
                  className="bg-gray-50 h-10 flex items-center justify-center text-xs text-gray-600"
                  style={{ height: `${SLOT_HEIGHT}px` }}
                >
                  {index % 2 === 0 && hora}
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {DIAS.map(dia => (
              <div key={dia} className="relative bg-white">
                {/* Líneas de fondo para las horas */}
                {horas.map((_, index) => (
                  <div 
                    key={index}
                    className={`border-t ${index % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  />
                ))}

                {/* Bloques de materias */}
                {bloquesPorDia[dia].map((bloque, index) => {
                  const width = bloque.totalColumnas > 1 
                    ? `${100 / bloque.totalColumnas}%` 
                    : '100%';
                  const left = bloque.totalColumnas > 1 
                    ? `${(100 / bloque.totalColumnas) * bloque.columna}%` 
                    : '0';

                  return (
                    <div
                      key={`${bloque.id}-${index}`}
                      className={`
                        absolute p-1 rounded cursor-pointer transition-all duration-200
                        hover:shadow-lg hover:z-10 hover:scale-105
                        ${bloque.tieneTraslape ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                      `}
                      style={{
                        top: `${bloque.top}px`,
                        height: `${bloque.height - 2}px`,
                        backgroundColor: bloque.color,
                        left,
                        width,
                        opacity: bloque.tieneTraslape ? 0.9 : 1
                      }}
                      onClick={() => abrirModal(bloque)}
                    >
                      <div className="text-white h-full flex flex-col justify-center px-1 overflow-hidden">
                        <div className="text-xs font-semibold truncate">
                          {bloque.nombre}
                        </div>
                        <div className="text-xs opacity-90 truncate">
                          {bloque.grupo}
                        </div>
                        {bloque.height > 60 && (
                          <>
                            <div className="text-xs opacity-80 truncate mt-0.5">
                              {bloque.profesor}
                            </div>
                            <div className="text-xs opacity-80">
                              {bloque.salon}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarioSemanal;
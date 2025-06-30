import { useMemo } from 'react';
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
/*
        // Ejemplo: bloquesDelDia para el día "LU" (Lunes)
            bloquesDelDia = [
              {
                id: "mat1",
                nombre: "Cálculo",
                grupo: "1251",
                profesor: "Dr. García",
                salon: "A-201",
                horario: {
                  dia: "LU",
                  inicio: "08:00",
                  fin: "10:00"
                },
                top: 36.4,
                height: 72.8,
                color: "#3B82F6",
                tieneTraslape: false
              },
              {
                id: "mat2", 
                nombre: "Programación",
                grupo: "1252",
                profesor: "Ing. López",
                salon: "B-105",
                horario: {
                  dia: "LU", 
                  inicio: "09:30",
                  fin: "11:00"
                },
                top: 91.0,
                height: 54.6,
                color: "#EF4444",
                tieneTraslape: true
              },
              {
                id: "mat3",
                nombre: "Física", 
                grupo: "1253",
                profesor: "Dr. Martínez",
                salon: "C-301",
                horario: {
                  dia: "LU",
                  inicio: "12:00", 
                  fin: "14:00"
                },
                top: 182.0,
                height: 72.8,
                color: "#10B981",
                tieneTraslape: false
              }
            ]
      */

      
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

  return (
    <div className="overflow-x-hidden">
      <div className="min-w-[37.5rem]"> {/* 600px / 16 = 37.5rem */}
        {/* Header con días */}
        <div className="grid grid-cols-[5rem,repeat(6,1fr)] gap-px bg-gray-200 mb-px"> {/* 80px / 16 = 5rem */}
          <div className="bg-gray-50 p-2"></div>
          {DIAS_NOMBRES.map((dia) => (
            <div key={dia} className="bg-gray-50 p-2 text-center">
              <div className="font-medium text-sm">{dia}</div>
             
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div className="relative">
          <div className="grid grid-cols-[5rem,repeat(6,1fr)] gap-px bg-gray-200"> {/* 80px / 16 = 5rem */}
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

            {/* Columnas de días */}
            {DIAS.map(dia => (
              <div key={dia} className="relative bg-white">
                {/* Líneas de fondo para las horas */}
                {horas.map((_, index) => (
                  <div 
                    key={index}
                    className={`border-t ${index % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                    style={{ height: `${SLOT_HEIGHT}rem` }}
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

                  // Verificar si es el bloque del modal activo
                  const esBloqueDelModal = modalAbierto && 
                    bloqueModalActivo?.id === bloque.id && 
                    bloqueModalActivo?.horario?.dia === bloque.horario.dia &&
                    bloqueModalActivo?.horario?.inicio === bloque.horario.inicio;
                  
                  const opacidadFinal = esBloqueDelModal ? 0.3 : (bloque.tieneTraslape ? 0.9 : 1);

                  return (
                    <div
                      key={`${bloque.id}-${index}`}
                      className={`
                        absolute p-1 rounded cursor-pointer transition-all duration-200
                        ${!esBloqueDelModal ? 'hover:shadow-lg hover:z-10 hover:scale-105' : 'z-0'}
                        ${bloque.tieneTraslape ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                      `}
                      style={{
                        top: `${bloque.top / 16}rem`, // Convertir px a rem
                        height: `${(bloque.height - 2) / 16}rem`, // Convertir px a rem
                        backgroundColor: bloque.color,
                        left,
                        width,
                        opacity: opacidadFinal,
                        zIndex: esBloqueDelModal ? .5 : 'auto' // para que se muestre detras del modal pero encima del grid
                      }}
                      onClick={() => !esBloqueDelModal && abrirModal(bloque)}
                      // onClick={() => abrirModal(bloque)}
                      // onClick={() => abrirModal(bloque)}
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
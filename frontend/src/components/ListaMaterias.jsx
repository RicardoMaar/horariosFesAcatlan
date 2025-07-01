import { useMemo, useState, useEffect } from 'react';
import useHorariosStore from '../store/useHorariosStore';

function ListaMaterias() {
  const materiasData = useHorariosStore(state => state.materiasData);
  const busqueda = useHorariosStore(state => state.busqueda);
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const toggleMateria = useHorariosStore(state => state.toggleMateria);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const abrirModal = useHorariosStore(state => state.abrirModal);
  
  // Estado para controlar qué semestres están expandidos
  const [semestresExpandidos, setSemestresExpandidos] = useState({});
  // Estado para controlar qué materias están expandidas
  const [materiasExpandidas, setMateriasExpandidas] = useState({});

  // Filtrar materias y grupos según búsqueda
  const materiasFiltradas = useMemo(() => {
    if (!materiasData) return null;
    if (!busqueda) return materiasData;
    
    const busquedaNorm = busqueda.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    const filtradas = {};
    
    Object.entries(materiasData).forEach(([clave, materia]) => {
      const nombreNorm = materia.nombre.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      const coincideNombre = nombreNorm.includes(busquedaNorm);
      
      // Filtrar grupos que coincidan con el profesor
      const gruposFiltrados = materia.grupos.filter(g => {
        const profNorm = g.profesor.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return profNorm.includes(busquedaNorm);
      });
      
      // Incluir materia si coincide el nombre o si tiene grupos que coinciden
      if (coincideNombre) {
        filtradas[clave] = materia; // Incluir todos los grupos si coincide el nombre
      } else if (gruposFiltrados.length > 0) {
        // Solo incluir los grupos que coinciden con el profesor
        filtradas[clave] = {
          ...materia,
          grupos: gruposFiltrados
        };
      }
    });
    
    return filtradas;
  }, [materiasData, busqueda]);

  // Auto-expandir semestres y materias cuando hay búsqueda
  useEffect(() => {
    if (busqueda && materiasFiltradas) {
      const nuevosSemestres = {};
      const nuevasMaterias = {};
      
      // Expandir todos los semestres y materias que tienen resultados
      Object.entries(materiasFiltradas).forEach(([clave, materia]) => {
        const semestre = materia.semestre || '00';
        nuevosSemestres[semestre] = true;
        nuevasMaterias[clave] = true;
      });
      
      setSemestresExpandidos(nuevosSemestres);
      setMateriasExpandidas(nuevasMaterias);
    } else if (!busqueda) {
      // Cuando no hay búsqueda, cerrar todo
      setSemestresExpandidos({});
      setMateriasExpandidas({});
    }
  }, [busqueda, materiasFiltradas]);

  // Detectar traslapes
  const traslapes = useMemo(() => {
    const traslapesSet = new Set();
    
    for (let i = 0; i < materiasSeleccionadas.length; i++) {
      for (let j = i + 1; j < materiasSeleccionadas.length; j++) {
        const materia1 = materiasSeleccionadas[i];
        const materia2 = materiasSeleccionadas[j];
        
        // Verificar traslape
        let hayTraslape = false;
        for (const h1 of materia1.horarios) {
          for (const h2 of materia2.horarios) {
            if (h1.dia === h2.dia) {
              const inicio1 = timeToMinutes(h1.inicio);
              const fin1 = timeToMinutes(h1.fin);
              const inicio2 = timeToMinutes(h2.inicio);
              const fin2 = timeToMinutes(h2.fin);
              
              if (inicio1 < fin2 && inicio2 < fin1) {
                hayTraslape = true;
                break;
              }
            }
          }
          if (hayTraslape) break;
        }
        
        if (hayTraslape) {
          traslapesSet.add(materia1.id);
          traslapesSet.add(materia2.id);
        }
      }
    }
    
    return traslapesSet;
  }, [materiasSeleccionadas]);

  // Agrupar materias por semestre
  const materiasPorSemestre = useMemo(() => {
    const materias = materiasFiltradas || materiasData;
    if (!materias) {
      return {};
    }

    const agrupadas = {};
    Object.entries(materias).forEach(([clave, materia]) => {
      const semestre = materia.semestre || '00';
      if (!agrupadas[semestre]) {
        agrupadas[semestre] = [];
      }
      agrupadas[semestre].push({ clave, ...materia });
    });

    // Ordenar semestres
    const resultado = Object.keys(agrupadas)
      .sort((a, b) => {
        if (a === '40') return 1; // Optativas al final
        if (b === '40') return -1;
        return parseInt(a) - parseInt(b);
      })
      .reduce((acc, key) => {
        acc[key] = agrupadas[key].sort((a, b) => a.nombre.localeCompare(b.nombre));
        return acc;
      }, {});
    
    return resultado;
  }, [materiasData, materiasFiltradas]);

  const getSemestreLabel = (semestre) => {
    if (semestre === '40') return 'Optativas';
    if (semestre === '00') return 'Sin semestre';
    return `${semestre}° Semestre`;
  };

  function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  const toggleSemestre = (semestre) => {
    setSemestresExpandidos(prev => ({
      ...prev,
      [semestre]: !prev[semestre]
    }));
  };

  const toggleMateriaClave = (clave) => {
    setMateriasExpandidas(prev => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  };

  return (
    <div className="space-y-2 pr-2">
      {Object.entries(materiasPorSemestre).map(([semestre, materias]) => (
        <div key={semestre} className="border border-gray-200 rounded-md">
          {/* Header del semestre */}
          <button
            onClick={() => toggleSemestre(semestre)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-sm text-gray-700">
              {getSemestreLabel(semestre)}
            </span>
            <div className="flex items-center gap-2">
              <svg 
                className={`w-4 h-4 transition-transform ${semestresExpandidos[semestre] ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Materias del semestre */}
          {semestresExpandidos[semestre] && (
            <div className="border-t border-gray-100">
              {materias.map((materia) => (
                <div key={materia.clave} className="border-t border-gray-50 first:border-t-0">
                  {/* Header de materia */}
                  <button
                    onClick={() => toggleMateriaClave(materia.clave)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {materia.nombre}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Clave: {materia.clave} • {materia.grupos.length} grupo{materia.grupos.length !== 1 && 's'}
                      </p>
                    </div>
                    <svg 
                      className={`w-4 h-4 transition-transform ${materiasExpandidas[materia.clave] ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Grupos */}
                  {materiasExpandidas[materia.clave] && (
                    <div className="bg-gray-50">
                      {materia.grupos.map((grupo) => {
                        const id = `${materia.clave}-${grupo.grupo}`;
                        const seleccionada = materiasSeleccionadas.some(m => m.id === id);
                        const tieneTraslape = seleccionada && traslapes.has(id);
                        const color = coloresAsignados[id];

                        return (
                          <div
                            key={grupo.grupo}
                            className={`
                              px-3 py-2 text-xs border-t border-gray-100 transition-colors cursor-pointer
                              ${seleccionada ? 'bg-primary-50' : 'hover:bg-white'}
                              ${tieneTraslape ? 'bg-red-50' : ''}
                            `}
                            onClick={(e) => {
                              // Solo abrir modal si no se hizo click en el checkbox
                              if (!e.target.closest('input[type="checkbox"]')) {
                                const materiaConGrupo = {
                                  id,
                                  clave: materia.clave,
                                  nombre: materia.nombre,
                                  grupo: grupo.grupo,
                                  profesor: grupo.profesor,
                                  salon: grupo.salon,
                                  horarios: grupo.horarios,
                                  semestre: materia.semestre
                                };
                                abrirModal(materiaConGrupo);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <label 
                                    className="flex items-center cursor-pointer"
                                    onClick={(e) => e.stopPropagation()} // Prevenir que el click del label abra el modal
                                  >
                                    <input
                                      type="checkbox"
                                      checked={seleccionada}
                                      onChange={() => toggleMateria(materia.clave, grupo)}
                                      className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="font-medium">
                                      Grupo {grupo.grupo}
                                    </span>
                                  </label>
                                  {seleccionada && (
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                  )}
                                  {tieneTraslape && (
                                    <span className="text-red-600 text-xs">
                                      ⚠️ Traslape
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-gray-600 ml-6">
                                  {grupo.profesor}
                                </div>
                                <div className="mt-1 text-gray-500 ml-6">
                                  {grupo.horarios.map(h => `${h.dia} ${h.inicio}-${h.fin}`).join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {Object.keys(materiasPorSemestre).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            No se encontraron materias
          </p>
        </div>
      )}
    </div>
  );
}

export default ListaMaterias;
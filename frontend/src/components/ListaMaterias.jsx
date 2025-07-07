import { useMemo, useState, useEffect } from 'react';
import useHorariosStore from '../store/useHorariosStore';
import { getMateriasConTraslapes } from '../utils/traslapes';
import '../styles/animations.css';

function ListaMaterias() {
  const materiasData = useHorariosStore(state => state.materiasData);
  const busqueda = useHorariosStore(state => state.busqueda);
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const toggleMateria = useHorariosStore(state => state.toggleMateria);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const abrirModal = useHorariosStore(state => state.abrirModal);
  
  const [semestresExpandidos, setSemestresExpandidos] = useState({});
  const [materiasExpandidas, setMateriasExpandidas] = useState({});

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
      
      const gruposFiltrados = materia.grupos.filter(g => {
        const profNorm = g.profesor.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return profNorm.includes(busquedaNorm);
      });
      
      if (coincideNombre) {
        filtradas[clave] = materia;
      } else if (gruposFiltrados.length > 0) {
        filtradas[clave] = {
          ...materia,
          grupos: gruposFiltrados
        };
      }
    });
    
    return filtradas;
  }, [materiasData, busqueda]);

  useEffect(() => {
    if (busqueda && materiasFiltradas) {
      const nuevosSemestres = {};
      const nuevasMaterias = {};
      
      Object.entries(materiasFiltradas).forEach(([clave, materia]) => {
        const semestre = materia.semestre || '00';
        nuevosSemestres[semestre] = true;
        nuevasMaterias[clave] = true;
      });
      
      setSemestresExpandidos(nuevosSemestres);
      setMateriasExpandidas(nuevasMaterias);
    } else if (!busqueda) {
      setSemestresExpandidos({});
      setMateriasExpandidas({});
    }
  }, [busqueda, materiasFiltradas]);

  const traslapes = useMemo(() => {
    return getMateriasConTraslapes(materiasSeleccionadas);
  }, [materiasSeleccionadas]);

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

    const resultado = Object.keys(agrupadas)
      .sort((a, b) => {
        if (a === '40') return 1;
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


  const toggleSemestre = (semestre) => {
    setSemestresExpandidos(prev => {
      const estaAbierto = prev[semestre];
      
      if (estaAbierto) {
        return {};
      } else {
        return { [semestre]: true };
      }
    });
    
    setMateriasExpandidas({});
  };

  const toggleMateriaClave = (clave) => {
    setMateriasExpandidas(prev => {
      const estaAbierto = prev[clave];
      
      if (estaAbierto) {
        return {};
      } else {
        return { [clave]: true };
      }
    });
  };

  return (
    <div className="space-y-2">
      {Object.entries(materiasPorSemestre).map(([semestre, materias]) => (
        <div key={semestre} className="border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => toggleSemestre(semestre)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="font-semibold text-sm text-gray-700">
              {getSemestreLabel(semestre)}
            </span>
            <div className="flex items-center gap-2">
              <svg 
                className={`w-4 h-4 arrow-icon ${semestresExpandidos[semestre] ? 'rotated' : ''} transition-transform duration-300 ease-in-out`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          <div className={`semestre-expand ${semestresExpandidos[semestre] ? 'semestre-expanded' : 'semestre-collapsed'} transition-all duration-300 ease-in-out overflow-hidden`}>
            <div className="border-t border-gray-100">
              {materias.map((materia, index) => (
                <div 
                  key={materia.clave} 
                  className={`materia-item border-t border-gray-50 first:border-t-0 transition-all duration-200 ${
                    semestresExpandidos[semestre] 
                      ? 'translate-y-0 opacity-100' 
                      : 'translate-y-2 opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: semestresExpandidos[semestre] ? `${index * 50}ms` : '0ms' 
                  }}
                >
                  <button
                    onClick={() => toggleMateriaClave(materia.clave)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 text-left"
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
                      className={`w-4 h-4 arrow-icon ${materiasExpandidas[materia.clave] ? 'rotated' : ''} transition-transform duration-300 ease-in-out`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`semestre-expand ${materiasExpandidas[materia.clave] ? 'semestre-expanded' : 'semestre-collapsed'} transition-all duration-300 ease-in-out overflow-hidden bg-gray-50`}>
                    {materia.grupos.map((grupo, grupoIndex) => {
                      const id = `${materia.clave}-${grupo.grupo}`;
                      const seleccionada = materiasSeleccionadas.some(m => m.id === id);
                      const tieneTraslape = seleccionada && traslapes.has(id);
                      const color = coloresAsignados[id];

                      return (
                        <div
                          key={grupo.grupo}
                          className={`
                            grupo-item px-3 py-2 text-xs border-t border-gray-100 transition-all duration-200 cursor-pointer
                            ${seleccionada ? 'bg-primary-50' : 'hover:bg-white'}
                            ${tieneTraslape ? 'bg-red-50' : ''}
                            ${materiasExpandidas[materia.clave] 
                              ? 'translate-y-0 opacity-100' 
                              : 'translate-y-1 opacity-0'
                            }
                          `}
                          style={{ 
                            transitionDelay: materiasExpandidas[materia.clave] ? `${grupoIndex * 30}ms` : '0ms' 
                          }}
                          onClick={(e) => {
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
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={seleccionada}
                                    onChange={() => toggleMateria(materia.clave, grupo)}
                                    className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors duration-200"
                                  />
                                  <span className="font-medium">
                                    Grupo {grupo.grupo}
                                  </span>
                                </label>
                                {seleccionada && (
                                  <div 
                                    className="w-3 h-3 rounded-full color-circle transition-all duration-200 hover:scale-110"
                                    style={{ backgroundColor: color }}
                                  />
                                )}
                                {tieneTraslape && (
                                  <span className="text-red-600 text-xs animate-pulse">
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
                </div>
              ))}
            </div>
          </div>
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
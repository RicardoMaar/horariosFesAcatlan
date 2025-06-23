import { useMemo } from 'react';
import useHorariosStore from '../store/useHorariosStore';

function ListaMaterias() {
  const materiasData = useHorariosStore(state => state.materiasData);
  const materiasFiltradas = useHorariosStore(state => state.getMateriasFiltradas());
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const toggleMateria = useHorariosStore(state => state.toggleMateria);
  const abrirModal = useHorariosStore(state => state.abrirModal);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const traslapes = useHorariosStore(state => state.getMateriasConTraslape());

  // Agrupar materias por semestre
  const materiasPorSemestre = useMemo(() => {
    const materias = materiasFiltradas || materiasData;
    if (!materias) return {};

    const agrupadas = {};
    Object.entries(materias).forEach(([clave, materia]) => {
      const semestre = materia.semestre || '00';
      if (!agrupadas[semestre]) {
        agrupadas[semestre] = [];
      }
      agrupadas[semestre].push({ clave, ...materia });
    });

    // Ordenar semestres
    return Object.keys(agrupadas)
      .sort((a, b) => {
        if (a === '40') return 1; // Optativas al final
        if (b === '40') return -1;
        return parseInt(a) - parseInt(b);
      })
      .reduce((acc, key) => {
        acc[key] = agrupadas[key].sort((a, b) => a.nombre.localeCompare(b.nombre));
        return acc;
      }, {});
  }, [materiasData, materiasFiltradas]);

  const getSemestreLabel = (semestre) => {
    if (semestre === '40') return 'Optativas';
    if (semestre === '00') return 'Sin semestre';
    return `${semestre}° Semestre`;
  };

  return (
    <div className="space-y-4">
      {Object.entries(materiasPorSemestre).map(([semestre, materias]) => (
        <div key={semestre}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 sticky top-0 bg-white py-1">
            {getSemestreLabel(semestre)}
          </h3>
          <div className="space-y-2">
            {materias.map((materia) => (
              <div key={materia.clave} className="border border-gray-200 rounded-md">
                {/* Header de materia */}
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => abrirModal(materia)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {materia.nombre}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Clave: {materia.clave}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {materia.grupos.length} grupo{materia.grupos.length !== 1 && 's'}
                    </span>
                  </div>
                </div>

                {/* Grupos */}
                <div className="border-t border-gray-100">
                  {materia.grupos.map((grupo) => {
                    const id = `${materia.clave}-${grupo.grupo}`;
                    const seleccionada = materiasSeleccionadas.some(m => m.id === id);
                    const tieneTraslape = seleccionada && traslapes.has(id);
                    const color = coloresAsignados[id];

                    return (
                      <div
                        key={grupo.grupo}
                        className={`
                          px-3 py-2 text-xs border-t border-gray-50 transition-colors
                          ${seleccionada ? 'bg-gray-50' : 'hover:bg-gray-50'}
                          ${tieneTraslape ? 'bg-red-50' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center cursor-pointer">
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
                            <div className="mt-1 text-gray-600">
                              {grupo.profesor}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-gray-500">
                              <span>{grupo.salon}</span>
                              <span>•</span>
                              <span>
                                {grupo.horarios.map(h => `${h.dia} ${h.inicio}-${h.fin}`).join(', ')}
                              </span>
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
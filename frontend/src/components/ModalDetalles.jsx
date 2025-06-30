import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import useHorariosStore from '../store/useHorariosStore';
import SelectorColor from './SelectorColor';

function ModalDetalles() {
  const modalAbierto = useHorariosStore(state => state.modalAbierto);
  const materiaEnModal = useHorariosStore(state => state.materiaEnModal);
  const cerrarModal = useHorariosStore(state => state.cerrarModal);
  const toggleMateria = useHorariosStore(state => state.toggleMateria);
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const cambiarColorMateria = useHorariosStore(state => state.cambiarColorMateria);

  const [mostrandoSelectorColor, setMostrandoSelectorColor] = useState(null);

  if (!materiaEnModal) return null;

  const esMateria = !materiaEnModal.grupo; // Si no tiene grupo, es la materia completa
  const estaSeleccionada = materiasSeleccionadas.some(m => m.id === materiaEnModal.id);

  return (
    <Dialog.Root open={modalAbierto} onOpenChange={cerrarModal}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden animate-modal-enter">
          <div className="p-6">
            {/* Header */}
            <Dialog.Title className="text-xl font-semibold mb-4">
              {materiaEnModal.nombre}
            </Dialog.Title>
            
            {/* Info básica */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Clave:</span>
                <span className="font-medium">{materiaEnModal.clave}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Semestre:</span>
                <span className="font-medium">
                  {materiaEnModal.semestre === '40' ? 'Optativa' : `${materiaEnModal.semestre}°`}
                </span>
              </div>
            </div>

            {/* Si es materia completa, mostrar todos los grupos */}
            {esMateria ? (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-700">Grupos disponibles:</h3>
                {materiaEnModal.grupos.map(grupo => {
                  const id = `${materiaEnModal.clave}-${grupo.grupo}`;
                  const seleccionada = materiasSeleccionadas.some(m => m.id === id);
                  const color = coloresAsignados[id];

                  return (
                    <div 
                      key={grupo.grupo}
                      className={`
                        border rounded-md p-3 transition-colors
                        ${seleccionada ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Grupo {grupo.grupo}</span>
                          {seleccionada && (
                            <>
                              <button
                                onClick={() => setMostrandoSelectorColor(mostrandoSelectorColor === id ? null : id)}
                                className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                              />
                              <button
                                onClick={() => setMostrandoSelectorColor(mostrandoSelectorColor === id ? null : id)}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                              >
                                Cambiar color
                              </button>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            toggleMateria(materiaEnModal.clave, grupo);
                            cerrarModal();
                          }}
                          className={`
                            px-3 py-1 rounded text-sm font-medium transition-colors
                            ${seleccionada 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                            }
                          `}
                        >
                          {seleccionada ? 'Quitar' : 'Agregar'}
                        </button>
                      </div>
                      
                      {mostrandoSelectorColor === id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                          <SelectorColor
                            colorActual={color}
                            onCambiarColor={(nuevoColor) => {
                              cambiarColorMateria(id, nuevoColor);
                              setMostrandoSelectorColor(null);
                            }}
                            onCerrar={() => setMostrandoSelectorColor(null)}
                          />
                        </div>
                      )}

                      <div className="space-y-1 text-sm text-gray-600">
                        <div>{grupo.profesor}</div>
                        <div>
                          {grupo.horarios.map(h => 
                            `${h.dia_nombre || h.dia} ${h.inicio}-${h.fin}`
                          ).join(', ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Si es un grupo específico desde el calendario O desde la lista
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Grupo {materiaEnModal.grupo}</span>
                      {estaSeleccionada && (
                        <>
                          <button
                            onClick={() => setMostrandoSelectorColor(mostrandoSelectorColor === materiaEnModal.id ? null : materiaEnModal.id)}
                            className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: coloresAsignados[materiaEnModal.id] }}
                          />
                          <button
                            onClick={() => setMostrandoSelectorColor(mostrandoSelectorColor === materiaEnModal.id ? null : materiaEnModal.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Cambiar color
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (estaSeleccionada) {
                          const materia = materiasSeleccionadas.find(m => m.id === materiaEnModal.id);
                          if (materia) {
                            toggleMateria(materia.clave, { grupo: materia.grupo });
                            cerrarModal();
                          }
                        } else {
                          const grupoData = {
                            grupo: materiaEnModal.grupo,
                            profesor: materiaEnModal.profesor,
                            salon: materiaEnModal.salon,
                            horarios: materiaEnModal.horarios
                          };
                          toggleMateria(materiaEnModal.clave, grupoData);
                          cerrarModal();
                        }
                      }}
                      className={`
                        px-3 py-1 rounded text-sm font-medium transition-colors
                        ${estaSeleccionada 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }
                      `}
                    >
                      {estaSeleccionada ? 'Quitar' : 'Agregar'}
                    </button>
                  </div>
                  
                  {mostrandoSelectorColor === materiaEnModal.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                      <SelectorColor
                        colorActual={coloresAsignados[materiaEnModal.id]}
                        onCambiarColor={(nuevoColor) => {
                          cambiarColorMateria(materiaEnModal.id, nuevoColor);
                          setMostrandoSelectorColor(null);
                        }}
                        onCerrar={() => setMostrandoSelectorColor(null)}
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-sm text-gray-600">
                    <div>{materiaEnModal.profesor}</div>
                    <div>
                      {materiaEnModal.horarios.map(h => 
                        `${h.dia_nombre || h.dia} ${h.inicio}-${h.fin}`
                      ).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 flex justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                Cerrar
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ModalDetalles;
import { useState, useEffect, startTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import useHorariosStore from '../store/useHorariosStore';
import SelectorColor from './SelectorColor';
import '../styles/animations.css';

function ModalDetalles() {
  const modalAbierto = useHorariosStore(state => state.modalAbierto);
  const materiaEnModal = useHorariosStore(state => state.materiaEnModal);
  const cerrarModal = useHorariosStore(state => state.cerrarModal);
  const toggleMateria = useHorariosStore(state => state.toggleMateria);
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const cambiarColorMateria = useHorariosStore(state => state.cambiarColorMateria);

  // 👈 MOVER TODOS LOS HOOKS AL INICIO (antes del return early)
  const [mostrandoSelectorColor, setMostrandoSelectorColor] = useState(null);
  const [cerrandoModal, setCerrandoModal] = useState(false);

  // 👈 MOVER useEffect AL INICIO
  useEffect(() => {
    if (modalAbierto) {
      setCerrandoModal(false);
    }
  }, [modalAbierto]);

  // 👈 AHORA SÍ el return early
  if (!materiaEnModal) return null;

  const esMateria = !materiaEnModal.grupo;
  const estaSeleccionada = materiasSeleccionadas.some(m => m.id === materiaEnModal.id);

  const handleToggleMateria = (clave, grupoData) => {
    startTransition(() => {
      toggleMateria(clave, grupoData);
    });
  };

  // Función para manejar cierre con animación
  const handleCerrar = () => {
    setCerrandoModal(true);
    setTimeout(() => {
      cerrarModal();
      setCerrandoModal(false);
    }, 200);
  };

  return (
    <Dialog.Root open={modalAbierto} onOpenChange={handleCerrar}>
      <Dialog.Portal>
        {/* 👈 AUMENTAR z-index del overlay */}
        <Dialog.Overlay className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] ${cerrandoModal ? 'modal-overlay-exit' : 'modal-overlay'}`} />
        
        {/* 👈 AUMENTAR z-index del contenido del modal */}
        <Dialog.Content className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden z-[101] ${cerrandoModal ? 'modal-content-exit' : 'modal-content'}`}>
          <div className="p-6">
            {/* Header */}
            <Dialog.Title className="text-xl font-semibold mb-4 modal-item">
              {materiaEnModal.nombre}
            </Dialog.Title>
            
            {/* Info básica */}
            <div className="space-y-2 mb-4 text-sm modal-item">
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
              <div className="space-y-3 modal-item">
                <h3 className="font-medium text-sm text-gray-700">Grupos disponibles:</h3>
                {materiaEnModal.grupos.map((grupo) => {
                  const id = `${materiaEnModal.clave}-${grupo.grupo}`;
                  const seleccionada = materiasSeleccionadas.some(m => m.id === id);
                  const color = coloresAsignados[id];

                  return (
                    <div 
                      key={grupo.grupo}
                      className={`
                        modal-grupo border rounded-md p-3 transition-colors
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
                                className="w-3 h-3 rounded-full cursor-pointer color-circle-modal"
                                style={{ backgroundColor: color }}
                              />
                              <button
                                onClick={() => setMostrandoSelectorColor(mostrandoSelectorColor === id ? null : id)}
                                className="text-sm text-blue-600 hover:text-blue-800 underline modal-button"
                              >
                                Cambiar color
                              </button>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            handleToggleMateria(materiaEnModal.clave, grupo);
                            // 👈 NO CERRAR automáticamente el modal aquí
                          }}
                          className={`
                            modal-button px-3 py-1 rounded text-sm font-medium transition-colors
                            ${seleccionada 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                            }
                          `}
                        >
                          {seleccionada ? 'Quitar' : 'Agregar'}
                        </button>
                      </div>
                      
                      <div className={`color-selector ${mostrandoSelectorColor === id ? 'show' : ''}`}>
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
                      </div>

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
              <div className="space-y-3 modal-item">
                <div className="border border-gray-200 rounded-md p-3 modal-grupo">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Grupo {materiaEnModal.grupo}</span>
                      {estaSeleccionada && (
                        <>
                          <button
                            onClick={() => setMostrandoSelectorColor(mostrandoSelectorColor === materiaEnModal.id ? null : materiaEnModal.id)}
                            className="w-3 h-3 rounded-full cursor-pointer color-circle-modal"
                            style={{ backgroundColor: coloresAsignados[materiaEnModal.id] }}
                          />
                          <button
                            onClick={() => setMostrandoSelectorColor(mostrandoSelectorColor === materiaEnModal.id ? null : materiaEnModal.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline modal-button"
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
                            handleToggleMateria(materia.clave, { grupo: materia.grupo });
                          }
                        } else {
                          const grupoData = {
                            grupo: materiaEnModal.grupo,
                            profesor: materiaEnModal.profesor,
                            salon: materiaEnModal.salon,
                            horarios: materiaEnModal.horarios
                          };
                          handleToggleMateria(materiaEnModal.clave, grupoData);
                        }
                        handleCerrar();
                      }}
                      className={`
                        modal-button px-3 py-1 rounded text-sm font-medium transition-colors
                        ${estaSeleccionada 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }
                      `}
                    >
                      {estaSeleccionada ? 'Quitar' : 'Agregar'}
                    </button>
                  </div>
                  
                  <div className={`color-selector ${mostrandoSelectorColor === materiaEnModal.id ? 'show' : ''}`}>
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
                  </div>

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
          <div className="border-t border-gray-200 px-6 py-3 flex justify-end modal-item">
            <Dialog.Close asChild>
              <button 
                onClick={handleCerrar}
                className="modal-button px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
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

import { useState, useEffect } from 'react';
import useHorariosStore from '../store/useHorariosStore';
import toast from 'react-hot-toast';
import '../styles/LimpiarHorarioButton.css'; // 👈 CSS específico del componente

function LimpiarHorarioButton() {
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const limpiarTodasLasMaterias = useHorariosStore(state => state.limpiarTodasLasMaterias);
  const limpiandoHorario = useHorariosStore(state => state.limpiandoHorario); // 👈 NUEVO
  const [mostrandoConfirmacion, setMostrandoConfirmacion] = useState(false);
  const [cerrandoModal, setCerrandoModal] = useState(false);

  const handleLimpiar = () => {
    if (materiasSeleccionadas.length === 0) {
      toast.error('No hay materias para limpiar');
      return;
    }
    
    setMostrandoConfirmacion(true);
  };

  const confirmarLimpiar = () => {
    setCerrandoModal(true);
    setTimeout(() => {
      limpiarTodasLasMaterias();
      setMostrandoConfirmacion(false);
      setCerrandoModal(false);
      // toast.success('Limpiando horario...'); // 👈 CAMBIAR mensaje
    }, 200);
  };

  const cancelarLimpiar = () => {
    setCerrandoModal(true);
    setTimeout(() => {
      setMostrandoConfirmacion(false);
      setCerrandoModal(false);
    }, 200);
  };

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (mostrandoConfirmacion) {
      setCerrandoModal(false);
    }
  }, [mostrandoConfirmacion]);

  // 👈 NUEVO: Mostrar toast cuando termine la limpieza
  useEffect(() => {
    if (!limpiandoHorario && materiasSeleccionadas.length === 0) {
      // Solo mostrar si realmente se limpiaron materias
      const timer = setTimeout(() => {
        if (materiasSeleccionadas.length === 0) {
          // toast.success('Horario limpiado correctamente');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [limpiandoHorario, materiasSeleccionadas.length]);

  // Si no hay materias, no mostrar el botón
  if (materiasSeleccionadas.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={handleLimpiar}
        className="limpiar-button inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors duration-200"
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
          />
        </svg>
        Limpiar horario
      </button>

      {/* Modal de confirmación */}
      {mostrandoConfirmacion && (
        <>
          {/* Overlay */}
          <div className={`limpiar-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${cerrandoModal ? 'limpiar-overlay-exit' : ''}`} />

          {/* Modal Content */}
          <div className={`limpiar-modal fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 z-50 ${cerrandoModal ? 'limpiar-modal-exit' : ''}`}>
            <div className="p-6">
              {/* Header */}
              <div className="limpiar-modal-item flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-red-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    ¿Limpiar horario?
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Se eliminarán todas las {materiasSeleccionadas.length} materias seleccionadas
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="limpiar-modal-item flex gap-3 justify-end">
                <button
                  onClick={cancelarLimpiar}
                  className="limpiar-modal-button px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarLimpiar}
                  className="limpiar-modal-button px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
                >
                  Sí, limpiar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LimpiarHorarioButton;
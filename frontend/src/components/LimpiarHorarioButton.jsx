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
        className="limpiar-button inline-flex items-center text-[13px] font-medium transition-colors"
        style={{ padding: '8px 13px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)' }}
      >
        Limpiar
      </button>

      {/* Modal de confirmación */}
      {mostrandoConfirmacion && (
        <>
          {/* Overlay */}
          <div className={`limpiar-overlay fixed inset-0 z-[100] ${cerrandoModal ? 'limpiar-overlay-exit' : ''}`} style={{ background: 'rgba(15,12,20,.5)', backdropFilter: 'blur(3px)' }} />

          {/* Modal Content */}
          <div
            className={`limpiar-modal fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-sm mx-4 z-[101] ${cerrandoModal ? 'limpiar-modal-exit' : ''}`}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', boxShadow: '0 28px 70px rgba(0,0,0,.35)' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="limpiar-modal-item flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--danger-soft)' }}>
                  <svg
                    className="w-6 h-6"
                    style={{ color: 'var(--danger-text)' }}
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
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                    ¿Limpiar horario?
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                    Se eliminarán todas las {materiasSeleccionadas.length} materias seleccionadas
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="limpiar-modal-item flex gap-3 justify-end">
                <button
                  onClick={cancelarLimpiar}
                  className="limpiar-modal-button px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarLimpiar}
                  className="limpiar-modal-button px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ background: 'var(--danger)' }}
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
import { useState, useEffect, startTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import useHorariosStore, { coloresBase } from '../store/useHorariosStore';
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

  const [mostrandoSelectorColor, setMostrandoSelectorColor] = useState(false);
  const [cerrandoModal, setCerrandoModal] = useState(false);

  useEffect(() => {
    if (modalAbierto) {
      setCerrandoModal(false);
      setMostrandoSelectorColor(false);
    }
  }, [modalAbierto, materiaEnModal?.id]);

  if (!materiaEnModal) return null;

  const { id, clave, nombre, grupo, profesor, salon, horarios, semestre } = materiaEnModal;
  const estaSeleccionada = materiasSeleccionadas.some(m => m.id === id);
  const color = coloresAsignados[id];
  const semestreLabel = semestre === '40' ? 'Optativa' : `${semestre}°`;

  const handleToggle = () => {
    startTransition(() => {
      if (estaSeleccionada) {
        toggleMateria(clave, { grupo });
      } else {
        toggleMateria(clave, { grupo, profesor, salon, horarios });
      }
    });
  };

  const handleCerrar = () => {
    setCerrandoModal(true);
    setTimeout(() => {
      cerrarModal();
      setCerrandoModal(false);
    }, 200);
  };

  const chipStyle = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--muted)'
  };

  return (
    <Dialog.Root open={modalAbierto} onOpenChange={handleCerrar}>
      <Dialog.Portal>
        <Dialog.Overlay className={`fixed inset-0 z-[100] ${cerrandoModal ? 'modal-overlay-exit' : 'modal-overlay'}`} style={{ background: 'rgba(15,12,20,.5)', backdropFilter: 'blur(3px)' }} />

        <Dialog.Content
          className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[101] overflow-y-auto ${cerrandoModal ? 'modal-content-exit' : 'modal-content'}`}
          style={{
            width: 'min(470px, 92vw)',
            maxHeight: '88vh',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '18px',
            boxShadow: '0 28px 70px rgba(0,0,0,.35)'
          }}
        >
          <div className="p-[22px] pb-2">
            <Dialog.Title
              className="font-display font-bold leading-tight modal-item"
              style={{ fontSize: '19px', color: 'var(--text)', letterSpacing: '-.01em', margin: '0 0 12px' }}
            >
              {nombre}
            </Dialog.Title>

            <div className="flex gap-2 mb-[18px] modal-item">
              <span className="text-[11.5px] rounded-lg" style={{ ...chipStyle, padding: '4px 10px' }}>
                Clave {clave}
              </span>
              <span className="text-[11.5px] rounded-lg" style={{ ...chipStyle, padding: '4px 10px' }}>
                {semestreLabel === 'Optativa' ? 'Optativa' : `${semestreLabel} semestre`}
              </span>
            </div>

            <h4
              className="modal-item"
              style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}
            >
              Detalle del grupo
            </h4>

            <div
              className="modal-grupo"
              style={{
                border: `1px solid ${estaSeleccionada ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '13px 14px',
                background: estaSeleccionada ? 'var(--primary-soft)' : 'var(--surface)'
              }}
            >
              <div className="flex items-center justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Grupo {grupo}
                  </span>
                  {estaSeleccionada && (
                    <span className="w-2.5 h-2.5 rounded-full color-circle-modal" style={{ background: color }} />
                  )}
                </div>
                <button
                  onClick={handleToggle}
                  className="modal-button rounded-lg text-[12.5px] font-semibold transition-colors"
                  style={
                    estaSeleccionada
                      ? { padding: '6px 14px', background: 'var(--danger-soft)', color: 'var(--danger-text)' }
                      : { padding: '6px 14px', background: 'var(--primary)', color: '#fff' }
                  }
                >
                  {estaSeleccionada ? 'Quitar' : 'Agregar'}
                </button>
              </div>

              {estaSeleccionada && (
                <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                  <span className="text-[10.5px] mr-0.5" style={{ color: 'var(--muted)' }}>Color:</span>
                  {coloresBase.map((c) => (
                    <button
                      key={c}
                      onClick={() => cambiarColorMateria(id, c)}
                      aria-label={`Color ${c}`}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        padding: 0,
                        cursor: 'pointer',
                        background: c,
                        border: `2px solid ${color === c ? 'var(--text)' : 'transparent'}`
                      }}
                    />
                  ))}
                  <button
                    onClick={() => setMostrandoSelectorColor(v => !v)}
                    aria-label="Más colores"
                    className="flex items-center justify-center"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      padding: 0,
                      cursor: 'pointer',
                      background: 'transparent',
                      border: '2px dashed var(--border)',
                      color: 'var(--muted)',
                      fontSize: '13px',
                      lineHeight: 1
                    }}
                  >
                    +
                  </button>
                </div>
              )}

              {estaSeleccionada && mostrandoSelectorColor && (
                <div className="mb-2.5 p-3 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <SelectorColor
                    colorActual={color}
                    onCambiarColor={(nuevoColor) => {
                      cambiarColorMateria(id, nuevoColor);
                      setMostrandoSelectorColor(false);
                    }}
                    onCerrar={() => setMostrandoSelectorColor(false)}
                  />
                </div>
              )}

              <div className="text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>
                {profesor}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
                {horarios.map(h => `${h.dia_nombre || h.dia} ${h.inicio}–${h.fin}`).join(', ')} · {salon}
              </div>
            </div>
          </div>

          <div className="flex justify-end modal-item" style={{ borderTop: '1px solid var(--border)', padding: '14px 22px' }}>
            <Dialog.Close asChild>
              <button
                onClick={handleCerrar}
                className="modal-button rounded-lg text-[13px] font-medium transition-colors"
                style={{ padding: '9px 18px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
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

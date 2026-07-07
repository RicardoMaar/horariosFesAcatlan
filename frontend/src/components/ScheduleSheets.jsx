import { AnimatePresence, motion } from 'framer-motion';
import useHorariosStore from '../store/useHorariosStore';

const enterTransition = { duration: 0.2, ease: 'easeOut' };
const MotionDiv = motion.div;
const MotionButton = motion.button;

function ScheduleSheets() {
  const opciones = useHorariosStore(state => state.opciones);
  const opcionActivaId = useHorariosStore(state => state.opcionActivaId);
  const setOpcionActiva = useHorariosStore(state => state.setOpcionActiva);
  const agregarOpcion = useHorariosStore(state => state.agregarOpcion);
  const eliminarOpcion = useHorariosStore(state => state.eliminarOpcion);

  return (
    <div className="flex items-center gap-[7px] ml-auto overflow-x-auto">
      <span className="text-[11px] font-medium mr-0.5 flex-shrink-0" style={{ color: 'var(--muted)' }}>
        Mis horarios
      </span>

      <AnimatePresence initial={false}>
        {opciones.map((opcion) => {
          const activa = opcion.id === opcionActivaId;
          return (
            <MotionDiv
              key={opcion.id}
              layout
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={enterTransition}
              className="relative group flex-shrink-0"
            >
              <button
                type="button"
                onClick={() => setOpcionActiva(opcion.id)}
                className="text-[13px] transition-colors"
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${activa ? 'var(--primary)' : 'var(--border)'}`,
                  background: activa ? 'var(--primary-soft)' : 'var(--surface)',
                  color: activa ? 'var(--primary-text)' : 'var(--muted)',
                  fontWeight: activa ? 600 : 500
                }}
              >
                {opcion.nombre}
              </button>
              {opciones.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    eliminarOpcion(opcion.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', boxShadow: '0 1px 3px rgba(0,0,0,.12)' }}
                  aria-label={`Cerrar ${opcion.nombre}`}
                >
                  ×
                </button>
              )}
            </MotionDiv>
          );
        })}
      </AnimatePresence>

      <MotionButton
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={agregarOpcion}
        className="text-[13px] flex-shrink-0 transition-colors"
        style={{ padding: '7px 12px', borderRadius: '10px', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--muted)' }}
        aria-label="Agregar nueva opción"
      >
        + Nueva
      </MotionButton>
    </div>
  );
}

export default ScheduleSheets;

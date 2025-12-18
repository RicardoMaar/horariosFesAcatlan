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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto">
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
                className="relative group"
              >
                <button
                  type="button"
                  onClick={() => setOpcionActiva(opcion.id)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    activa
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
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
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white border border-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-700"
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
          className="px-2.5 py-1.5 text-sm rounded-md border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
          aria-label="Agregar nueva opcion"
        >
          + Nueva
        </MotionButton>
      </div>
    </div>
  );
}

export default ScheduleSheets;

import { Toaster } from 'react-hot-toast';
import { useMemo, useRef } from 'react';
import CarreraSelector from './components/CarreraSelector';
import BuscadorMaterias from './components/BuscadorMaterias';
import ListaMaterias from './components/ListaMaterias';
import CalendarioSemanal from './components/CalendarioSemanal';
import ModalDetalles from './components/ModalDetalles';
import ExportMenu from './components/ExportMenu';
import LimpiarHorarioButton from './components/LimpiarHorarioButton';
import useHorariosStore from './store/useHorariosStore';
import ExportableCalendar from './components/ExportableCalendar';
import { useStatus } from './hooks/useStatus';
import ScheduleSheets from './components/ScheduleSheets';

function App() {
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const exportableCalendarRef = useRef(null);
  const { fechaActualizacion, loading: statusLoading } = useStatus();

  const fechaActualizacionTexto = useMemo(() => {
    if (!fechaActualizacion) {
      return null;
    }
    const date = new Date(fechaActualizacion);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City'
    }).format(date);
  }, [fechaActualizacion]);

  const statusLabel = fechaActualizacionTexto
    ? `Actualizado: ${fechaActualizacionTexto} (CDMX)`
    : statusLoading
      ? 'Actualizando...'
      : 'Actualizacion no disponible';

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-handwritten text-primary-700">
                Horarios FES Acatlán
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {statusLabel}
              </p>
            </div>
            {/* Mostrar botones siempre, pero condicionar funcionalidad */}
            <div className="flex items-center gap-3">
              <LimpiarHorarioButton />
              <ExportMenu exportableRef={exportableCalendarRef} />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 space-y-4">
          <ScheduleSheets />
          <div className="flex">
            <div className="w-full lg:w-1/3 xl:w-1/4">
              <CarreraSelector />
            </div>
          </div>
        </div>

        {/* Mostrar siempre la vista del calendario */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel izquierdo - Lista de materias */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 h-full lg:h-[calc(100vh-180px)] flex flex-col">
              <h2 className="text-2xl mb-4 font-handwritten">
                Materias disponibles
              </h2>
              {carreraSeleccionada ? (
                <>
                  <BuscadorMaterias />
                  <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                    <ListaMaterias />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-sm">Selecciona una carrera para ver las materias disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Calendario */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-full lg:h-[calc(100vh-180px)]">
              <h2 className="text-2xl mb-4 font-handwritten">
                Horario
              </h2>
              <div className="flex-1 min-h-0">
                <CalendarioSemanal />
              </div>
            </div>
          </div>
        </div>
      </main>

      <ExportableCalendar
        ref={exportableCalendarRef}
        materias={materiasSeleccionadas}
        coloresAsignados={coloresAsignados}
        carrera={carreraSeleccionada}
      />

      {/* Modal de detalles */}
      <ModalDetalles />
    </div>
  );
}

export default App;

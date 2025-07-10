import { Toaster } from 'react-hot-toast';
import { useRef } from 'react';
import CarreraSelector from './components/CarreraSelector';
import BuscadorMaterias from './components/BuscadorMaterias';
import ListaMaterias from './components/ListaMaterias';
import CalendarioSemanal from './components/CalendarioSemanal';
import ModalDetalles from './components/ModalDetalles';
import ExportMenu from './components/ExportMenu';
import LimpiarHorarioButton from './components/LimpiarHorarioButton';
import useHorariosStore from './store/useHorariosStore';
import ExportableCalendar from './components/ExportableCalendar';

function App() {
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);
  const materiasData = useHorariosStore(state => state.materiasData);

  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const exportableCalendarRef = useRef(null);

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
            <h1 className="text-3xl font-handwritten text-primary-700">
              Horarios FES Acatlán
            </h1>
            {/* Agregar botón de limpiar junto con ExportMenu */}
            {carreraSeleccionada && (
              <div className="flex items-center gap-3">
                <LimpiarHorarioButton />
                <ExportMenu exportableRef={exportableCalendarRef} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex">
        <div className="w-full lg:w-1/3 xl:w-1/4">
          <CarreraSelector />
        </div>
      </div>

        {carreraSeleccionada && materiasData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel izquierdo - Lista de materias */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-4 h-full lg:h-[calc(100vh-180px)] flex flex-col">
                <h2 className="text-2xl mb-4 font-handwritten">
                  Materias disponibles
                </h2>
                <BuscadorMaterias />
                <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                  <ListaMaterias />
                </div>
              </div>
            </div>

            {/* Panel derecho - Calendario */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-lg shadow-sm p-4 flex flex-col h-full">
                <h2 className="text-2xl mb-4 font-handwritten">
                  Horario
                </h2>
                <div className="flex-1 min-h-0">
                  <CalendarioSemanal />
                </div>
              </div>
            </div>
          </div>
        )}


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
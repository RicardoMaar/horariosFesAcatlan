
import { Toaster } from 'react-hot-toast';
import CarreraSelector from './components/CarreraSelector';
import BuscadorMaterias from './components/BuscadorMaterias';
import ListaMaterias from './components/ListaMaterias';
import CalendarioSemanal from './components/CalendarioSemanal';
import ModalDetalles from './components/ModalDetalles';
import ExportMenu from './components/ExportMenu';
import useHorariosStore from './store/useHorariosStore';

function App() {
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);
  const materiasData = useHorariosStore(state => state.materiasData);

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
            <h1 className="text-2xl font-handwritten text-primary-700">
              Horarios FES Acatlán
            </h1>
            {carreraSeleccionada && <ExportMenu />}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Selector de carrera */}
        <div className="mb-6">
          <CarreraSelector />
        </div>

        {carreraSeleccionada && materiasData && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Panel izquierdo - Lista de materias */}
            <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
                <h2 className="text-lg font-semibold mb-4 font-handwritten">
                  Materias disponibles
                </h2>
                <BuscadorMaterias />
                <div className="mt-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                  <ListaMaterias />
                </div>
              </div>
            </div>

            {/* Panel derecho - Calendario */}
            <div className="lg:flex-1">
              <div className="bg-white rounded-lg shadow-sm p-4 h-[calc(85vh-100px)] flex flex-col">
                <h2 className="text-lg font-semibold mb-4 font-handwritten">
                  Horario semanal
                </h2>
                <div className="flex-1 overflow-hidden">
                  <CalendarioSemanal />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado inicial */}
        {!carreraSeleccionada && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-handwritten text-gray-700 mb-2">
              ¡Comienza seleccionando tu carrera!
            </h2>
            <p className="text-gray-500">
              Elige tu carrera para ver las materias disponibles
            </p>
          </div>
        )}
      </main>

      {/* Modal de detalles */}
      <ModalDetalles />
    </div>
  );
}

export default App;
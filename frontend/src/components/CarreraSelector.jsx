import * as Select from '@radix-ui/react-select';
import { useCarreras, useHorarios } from '../hooks/useCarreras';
import useHorariosStore from '../store/useHorariosStore';
import { useMemo } from 'react';

function CarreraSelector() {
  const { carreras, loading: loadingCarreras } = useCarreras();
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);
  const setCarrera = useHorariosStore(state => state.setCarrera);
  const { loading: loadingHorarios } = useHorarios(carreraSeleccionada);

  // Ordenar carreras alfabéticamente
  const carrerasOrdenadas = useMemo(() => {
    if (!carreras) return [];
    return Object.entries(carreras).sort((a, b) => 
      a[1].nombre.localeCompare(b[1].nombre, 'es')
    );
  }, [carreras]);

  const handleSelectCarrera = (codigo) => {
    setCarrera(codigo);
  };

  if (loadingCarreras) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md w-full max-w-md"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Select.Root value={carreraSeleccionada} onValueChange={handleSelectCarrera}>
        <Select.Trigger className="inline-flex items-center justify-between rounded-md px-4 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full max-w-md">
          <Select.Value placeholder="Selecciona tu carrera..." />
          <Select.Icon className="ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content 
            className="overflow-hidden bg-white rounded-md shadow-lg border border-gray-200"
            position="popper"
            sideOffset={5}
            align="start"
          >
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </Select.ScrollUpButton>

            <Select.Viewport className="p-2 max-h-60">
              {carrerasOrdenadas.map(([codigo, carrera]) => (
                <Select.Item
                  key={codigo}
                  value={codigo}
                  className={`
                    relative flex items-center px-8 py-2 text-sm rounded cursor-pointer 
                    hover:bg-primary-50 focus:bg-primary-100 focus:outline-none 
                    data-[highlighted]:bg-primary-50
                    ${carreraSeleccionada === codigo ? 'bg-primary-50 text-primary-900' : ''}
                  `}
                >
                  <Select.ItemText>
                    <div>
                      <div className="font-medium">{carrera.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {carrera.total_materias} materias • {carrera.semestres_regulares} semestres
                      </div>
                    </div>
                  </Select.ItemText>
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>

            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {loadingHorarios && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando horarios...
        </div>
      )}

      {carreraSeleccionada && carreras && (
        <div className="text-sm text-gray-600">
          <span className="font-handwritten text-lg">{carreras[carreraSeleccionada]?.nombre}</span>
        </div>
      )}
    </div>
  );
}

export default CarreraSelector;
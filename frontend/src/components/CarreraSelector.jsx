import * as Select from '@radix-ui/react-select';
import { useCarreras, useHorarios } from '../hooks/useCarreras';
import useHorariosStore from '../store/useHorariosStore';
import { useMemo } from 'react';

function CarreraSelector() {
  const { carreras, loading: loadingCarreras } = useCarreras();
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);
  const setCarrera = useHorariosStore(state => state.setCarrera);
  const { loading: loadingHorarios } = useHorarios(carreraSeleccionada);

  const carrerasOrdenadas = useMemo(() => {
    if (!carreras) return [];
    return Object.entries(carreras).sort((a, b) =>
      a[1].nombre.localeCompare(b[1].nombre, 'es')
    );
  }, [carreras]);

  if (loadingCarreras) {
    return (
      <div className="animate-pulse">
        <div className="h-[42px] w-64 rounded-[11px]" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Select.Root value={carreraSeleccionada || ''} onValueChange={setCarrera}>
        <Select.Trigger
          className="inline-flex items-center focus:outline-none"
          style={{ padding: '9px 14px', borderRadius: '11px', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
        >
          <span
            className="mr-2.5 font-semibold uppercase"
            style={{ color: 'var(--muted)', fontSize: '10.5px', letterSpacing: '.06em' }}
          >
            Carrera
          </span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            <Select.Value placeholder="Selecciona tu carrera…" />
          </span>
          <Select.Icon className="ml-3" style={{ color: 'var(--muted)', fontSize: '10px' }}>
            ▼
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={6}
            align="start"
            className="overflow-hidden"
            style={{ width: '320px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,.16)' }}
          >
            <Select.Viewport className="p-1.5 max-h-[340px] overflow-y-auto custom-scrollbar">
              {carrerasOrdenadas.map(([codigo, carrera]) => (
                <Select.Item
                  key={codigo}
                  value={codigo}
                  className="relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[9px] cursor-pointer text-[13px] focus:outline-none data-[highlighted]:bg-[var(--primary-soft)]"
                  style={{ color: 'var(--text)' }}
                >
                  <Select.ItemText>{carrera.nombre}</Select.ItemText>
                  <Select.ItemIndicator style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    ✓
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {loadingHorarios && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando…
        </div>
      )}
    </div>
  );
}

export default CarreraSelector;

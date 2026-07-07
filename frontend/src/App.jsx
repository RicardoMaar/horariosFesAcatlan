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
import useTheme from './store/useTheme';
import ExportableCalendar from './components/ExportableCalendar';
import { useStatus } from './hooks/useStatus';
import ScheduleSheets from './components/ScheduleSheets';
import { getMateriasConTraslapes, horaAMinutos } from './utils/traslapes';

function App() {
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const coloresAsignados = useHorariosStore(state => state.coloresAsignados);
  const dark = useTheme(state => state.dark);
  const toggleDark = useTheme(state => state.toggle);
  const exportableCalendarRef = useRef(null);
  const { fechaActualizacion, loading: statusLoading } = useStatus();

  const fechaActualizacionTexto = useMemo(() => {
    if (!fechaActualizacion) return null;
    const date = new Date(fechaActualizacion);
    if (Number.isNaN(date.getTime())) return null;
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
      : 'Actualización no disponible';

  // Chips del encabezado del calendario: traslapes y carga horaria.
  const traslapeCount = useMemo(
    () => getMateriasConTraslapes(materiasSeleccionadas).size,
    [materiasSeleccionadas]
  );

  const horasSemana = useMemo(() => {
    const min = materiasSeleccionadas.reduce((acc, m) => (
      acc + (m.horarios || []).reduce((s, h) => s + (horaAMinutos(h.fin) - horaAMinutos(h.inicio)), 0)
    ), 0);
    return Math.round(min / 60);
  }, [materiasSeleccionadas]);

  const selCount = materiasSeleccionadas.length;

  return (
    <div className="min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#26232B', color: '#fff' } }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="mx-auto max-w-[1340px] px-6 py-[13px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/apple-touch-icon.png"
              alt="Logo Horarios FES Acatlán"
              className="w-[38px] h-[38px] rounded-xl object-cover"
              style={{ boxShadow: '0 3px 10px var(--primary-glow)' }}
            />
            <div>
              <h1
                className="font-display font-bold leading-none"
                style={{ fontSize: '21px', letterSpacing: '-.02em', color: 'var(--text)' }}
              >
                Horarios <span style={{ color: 'var(--primary)' }}>FES Acatlán</span>
              </h1>
              <p className="mt-[3px] flex items-center gap-1.5" style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
                {statusLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors"
              style={{ padding: '8px 13px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
              aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <span
                className="inline-block w-3.5 h-3.5 rounded-full"
                style={dark
                  ? { background: '#FBBF24', boxShadow: 'inset -4px -3px 0 var(--surface2)' }
                  : { background: 'linear-gradient(135deg,#FBBF24,#F59E0B)' }}
              />
              {dark ? 'Claro' : 'Oscuro'}
            </button>
            <LimpiarHorarioButton />
            <ExportMenu exportableRef={exportableCalendarRef} />
          </div>
        </div>
      </header>

      {/* Toolbar: carrera + hojas de horario */}
      <div className="mx-auto max-w-[1340px] px-6 pt-[18px] flex items-center gap-3 flex-wrap">
        <CarreraSelector />
        <ScheduleSheets />
      </div>

      {/* Contenido principal */}
      <main className="mx-auto max-w-[1340px] px-6 pt-4 pb-7 grid grid-cols-1 lg:grid-cols-[362px_1fr] gap-[18px] items-start">
        {/* Panel izquierdo - Lista de materias */}
        <section
          className="flex flex-col overflow-hidden lg:h-[calc(100vh-176px)] min-h-[520px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}
        >
          <div className="px-[18px] pt-[17px] pb-[13px]" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold" style={{ fontSize: '17px', color: 'var(--text)', letterSpacing: '-.01em' }}>
                Materias disponibles
              </h2>
              {carreraSeleccionada && (
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--primary-text)', background: 'var(--primary-soft)', padding: '3px 9px', borderRadius: '20px' }}
                >
                  {selCount} elegidas
                </span>
              )}
            </div>
            {carreraSeleccionada && <BuscadorMaterias />}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable p-3">
            {carreraSeleccionada ? (
              <ListaMaterias />
            ) : (
              <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center px-6" style={{ color: 'var(--muted)' }}>
                <div
                  className="flex items-center justify-center mb-3.5"
                  style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '24px' }}
                >
                  ✦
                </div>
                <p className="text-[13px] max-w-[220px] leading-relaxed">
                  Selecciona una carrera para ver las materias disponibles.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Panel derecho - Calendario */}
        <section
          className="flex flex-col overflow-hidden lg:h-[calc(100vh-176px)] min-h-[520px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}
        >
          <div className="px-[18px] py-[15px] flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <h2 className="font-display font-semibold" style={{ fontSize: '17px', color: 'var(--text)', letterSpacing: '-.01em' }}>
                Horario
              </h2>
              {traslapeCount > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                  style={{ color: 'var(--danger-text)', background: 'var(--danger-soft)', padding: '4px 10px', borderRadius: '20px' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--danger)' }} />
                  {traslapeCount === 1 ? '1 traslape' : `${traslapeCount} traslapes`}
                </span>
              )}
            </div>
            {selCount > 0 && (
              <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
                {selCount} {selCount === 1 ? 'grupo' : 'grupos'} · {horasSemana} h/sem
              </span>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-auto px-1.5 pb-2">
            <CalendarioSemanal />
          </div>
        </section>
      </main>

      <ExportableCalendar
        ref={exportableCalendarRef}
        materias={materiasSeleccionadas}
        coloresAsignados={coloresAsignados}
        carrera={carreraSeleccionada}
      />

      <ModalDetalles />
    </div>
  );
}

export default App;

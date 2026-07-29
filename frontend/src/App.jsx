import { Toaster } from 'react-hot-toast';
import { useMemo, useRef } from 'react';
import FuenteSelector from './components/FuenteSelector';
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
  const fuenteActivaId = useHorariosStore(state => state.fuenteActivaId);
  const fuenteActiva = useHorariosStore(state => state.fuentesSeleccionadas.find(fuente => fuente.id === state.fuenteActivaId));
  const fuentesSeleccionadas = useHorariosStore(state => state.fuentesSeleccionadas);
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
    ? fechaActualizacionTexto
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
        <div className="mx-auto flex max-w-[1340px] flex-col gap-3 px-4 py-3 sm:px-6 sm:py-[13px] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <img
              src="/apple-touch-icon.png"
              alt="Logo Horarios FES Acatlán"
              className="h-[42px] w-[42px] shrink-0 rounded-xl object-cover sm:h-[38px] sm:w-[38px]"
              style={{ boxShadow: '0 3px 10px var(--primary-glow)' }}
            />
            <div>
              <h1
                className="font-display text-[20px] font-bold leading-none tracking-[-.02em] sm:text-[21px]"
                style={{ color: 'var(--text)' }}
              >
                Horarios <span style={{ color: 'var(--primary)' }}>FES Acatlán</span>
              </h1>
              <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-snug sm:text-[11.5px]" style={{ color: 'var(--muted)' }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="shrink-0">Última actualización:</span>
                <time dateTime={fechaActualizacion || undefined} className="font-medium">{statusLabel}</time>
                <span className="shrink-0">· CDMX</span>
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              onClick={toggleDark}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 text-[13px] font-medium transition-colors sm:flex-none"
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
      <div className="mx-auto flex max-w-[1340px] flex-col gap-3 px-3 pt-3 sm:px-6 sm:pt-[18px]">
        <FuenteSelector />
        <ScheduleSheets />
      </div>

      {/* Contenido principal */}
      <main className="mx-auto grid max-w-[1340px] grid-cols-1 items-start gap-3 px-3 pb-5 pt-3 sm:gap-[18px] sm:px-6 sm:pt-4 sm:pb-7 lg:grid-cols-[362px_1fr]">
        {/* Panel izquierdo - Lista de materias */}
        <section
          className="flex min-h-[460px] flex-col overflow-hidden lg:h-[calc(100vh-176px)] lg:min-h-[520px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}
        >
          <div className="px-[18px] pt-[17px] pb-[13px]" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold" style={{ fontSize: '17px', color: 'var(--text)', letterSpacing: '-.01em' }}>
                Materias disponibles
              </h2>
              {fuenteActivaId && (
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--primary-text)', background: 'var(--primary-soft)', padding: '3px 9px', borderRadius: '20px' }}
                >
                  {selCount} elegidas
                </span>
              )}
            </div>
            {fuenteActivaId && <BuscadorMaterias />}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable p-3">
            {fuenteActivaId ? (
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
                  Selecciona una carrera o idioma para ver los grupos disponibles.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Panel derecho - Calendario */}
        <section
          className="flex min-h-[460px] flex-col overflow-hidden lg:h-[calc(100vh-176px)] lg:min-h-[520px]"
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
        carrera={fuenteActiva?.nombre || carreraSeleccionada}
        fuentes={fuentesSeleccionadas}
      />

      <ModalDetalles />
    </div>
  );
}

export default App;

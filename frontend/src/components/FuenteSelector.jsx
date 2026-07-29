import * as Popover from '@radix-ui/react-popover';
import { useEffect, useMemo, useState } from 'react';
import useHorariosStore from '../store/useHorariosStore';
import { useFuenteData, useFuentesCatalogo } from '../hooks/useFuentes';
import {
  construirFuenteCarrera,
  construirFuenteIdioma,
  contarFuentes,
  MAX_CARRERAS,
  MAX_IDIOMAS
} from '../utils/fuentes';

function FuenteSelector() {
  const { carreras, idiomas, loading: catalogoLoading } = useFuentesCatalogo();
  const { loading: fuenteLoading } = useFuenteData();
  const fuentes = useHorariosStore((state) => state.fuentesSeleccionadas);
  const fuenteActivaId = useHorariosStore((state) => state.fuenteActivaId);
  const fuentesInicializadas = useHorariosStore((state) => state.fuentesInicializadas);
  const agregarFuente = useHorariosStore((state) => state.agregarFuente);
  const setFuenteActiva = useHorariosStore((state) => state.setFuenteActiva);
  const quitarFuente = useHorariosStore((state) => state.quitarFuente);
  const [open, setOpen] = useState(false);

  const carrerasOrdenadas = useMemo(() => Object.values(carreras || {}).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [carreras]);
  const idiomasOrdenados = useMemo(() => Object.values(idiomas || {}).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [idiomas]);
  const fuenteActiva = fuentes.find((fuente) => fuente.id === fuenteActivaId);
  const carreraCount = contarFuentes(fuentes, 'carrera');
  const idiomaCount = contarFuentes(fuentes, 'idioma');

  useEffect(() => {
    if (catalogoLoading || fuentes.length > 0 || fuentesInicializadas || !carreras) return;
    const codigoInicial = carreras['20321'] ? '20321' : Object.keys(carreras)[0];
    if (codigoInicial) agregarFuente(construirFuenteCarrera(codigoInicial, carreras[codigoInicial]));
  }, [agregarFuente, carreras, catalogoLoading, fuentes.length, fuentesInicializadas]);

  if (catalogoLoading) {
    return <div className="h-[44px] w-full max-w-[390px] animate-pulse rounded-[12px]" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }} />;
  }

  const seleccionada = (id) => fuentes.some((fuente) => fuente.id === id);
  const addFuente = (fuente) => {
    agregarFuente(fuente);
    setOpen(false);
  };
  const removeFuente = (fuente) => {
    quitarFuente(fuente.id);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Popover.Anchor asChild>
            <div className="min-w-0 flex-1">
              <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-[44px] w-full min-w-0 items-center gap-2 rounded-[12px] px-3.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:w-auto sm:min-w-[250px]"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
            aria-label="Seleccionar carrera o idioma"
          >
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[.06em]" style={{ color: 'var(--muted)' }}>
              {fuenteActiva?.etiqueta || 'Fuente'}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {fuenteActiva?.nombre || 'Selecciona una fuente'}
            </span>
            {fuenteLoading ? (
              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            ) : (
              <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted)' }}>▼</span>
            )}
              </button>
            </div>
          </Popover.Anchor>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="hidden min-h-[44px] shrink-0 items-center gap-1.5 rounded-[12px] px-3 text-[13px] font-semibold transition-colors hover:bg-[var(--surface2)] sm:inline-flex"
              style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--surface2)' }}
            >
              <span className="text-base leading-none">+</span> Agregar
            </button>
          </Popover.Trigger>
        </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-[11px] px-3 text-[13px] font-semibold transition-colors hover:bg-[var(--surface2)] sm:hidden"
        style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--surface2)' }}
      >
        <span className="text-base leading-none">+</span> Agregar carrera o idioma
      </button>

        {fuentes.length > 0 && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 pb-0.5">
          <span className="mr-0.5 shrink-0 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Fuentes activas:</span>
          {fuentes.map((fuente) => (
            <div key={fuente.id} className="group flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: fuente.id === fuenteActivaId ? 'var(--surface2)' : 'var(--surface)', border: '1px solid var(--border)', color: fuente.id === fuenteActivaId ? 'var(--text)' : 'var(--muted)', boxShadow: fuente.id === fuenteActivaId ? 'inset 0 -2px 0 var(--muted)' : 'none' }}>
              <button type="button" onClick={() => setFuenteActiva(fuente.id)} className="max-w-[150px] truncate" aria-label={`Ver ${fuente.etiqueta} ${fuente.nombre}`}>
                {fuente.nombre}
              </button>
              <button type="button" onClick={() => quitarFuente(fuente.id)} className="rounded-full px-0.5 text-xs leading-none opacity-60 hover:opacity-100" aria-label={`Quitar ${fuente.nombre}`}>
                ×
              </button>
            </div>
          ))}
          <span className="basis-full text-[10px] sm:basis-auto" style={{ color: 'var(--muted-2)' }}>{carreraCount} {carreraCount === 1 ? 'carrera' : 'carreras'} · {idiomaCount} {idiomaCount === 1 ? 'idioma' : 'idiomas'}</span>
        </div>
        )}
      </div>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-[80] max-h-[min(560px,calc(100vh-32px))] w-[min(360px,calc(100vw-24px))] overflow-y-auto rounded-[14px] p-2 shadow-2xl"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <FuenteOptions
            carreras={carrerasOrdenadas}
            idiomas={idiomasOrdenados}
            seleccionada={seleccionada}
            addFuente={addFuente}
            removeFuente={removeFuente}
            carreraCount={carreraCount}
            idiomaCount={idiomaCount}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function FuenteOptions({ carreras, idiomas, seleccionada, addFuente, removeFuente, carreraCount, idiomaCount }) {
  const [tipoAgregar, setTipoAgregar] = useState('carrera');
  const itemClass = 'flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-45';
  const mostrandoCarreras = tipoAgregar === 'carrera';
  const opciones = mostrandoCarreras ? carreras : idiomas;

  return (
    <div>
      <div className="px-2 pb-2 pt-1">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Agregar a tu horario</p>
        <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>Elige carreras e idiomas para combinarlos en un mismo horario.</p>
      </div>

      <div className="mx-2 mb-2 grid grid-cols-2 gap-1 rounded-[11px] p-1" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }} role="tablist" aria-label="Tipo de fuente">
        {[
          { tipo: 'carrera', label: 'Carreras', count: `${carreraCount}/${MAX_CARRERAS}` },
          { tipo: 'idioma', label: 'Idiomas', count: `${idiomaCount}/${MAX_IDIOMAS}` }
        ].map((opcion) => {
          const activa = tipoAgregar === opcion.tipo;
          return (
            <button
              key={opcion.tipo}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setTipoAgregar(opcion.tipo)}
              className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-[8px] px-2 text-[12px] font-semibold transition-colors"
              style={{ background: activa ? 'var(--surface)' : 'transparent', color: activa ? 'var(--text)' : 'var(--muted)', boxShadow: activa ? '0 1px 2px rgba(0,0,0,.08)' : 'none' }}
            >
              <span>{opcion.label}</span>
              <span className="text-[10px] font-medium" style={{ color: activa ? 'var(--muted)' : 'var(--muted-2)' }}>{opcion.count}</span>
            </button>
          );
        })}
      </div>

      <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--muted)' }}>
        {mostrandoCarreras ? `Selecciona una carrera · ${carreraCount} de ${MAX_CARRERAS}` : `Selecciona un idioma · ${idiomaCount} de ${MAX_IDIOMAS}`}
      </p>
      {opciones.map((opcion) => {
        const fuente = mostrandoCarreras ? construirFuenteCarrera(opcion.codigo, opcion) : construirFuenteIdioma(opcion);
        const count = mostrandoCarreras ? carreraCount : idiomaCount;
        const max = mostrandoCarreras ? MAX_CARRERAS : MAX_IDIOMAS;
        const estaSeleccionada = seleccionada(fuente.id);
        const disabled = !estaSeleccionada && count >= max;
        return (
          <button
            key={fuente.id}
            type="button"
            disabled={disabled}
            onClick={() => (estaSeleccionada ? removeFuente(fuente) : addFuente(fuente))}
            className={itemClass}
            style={{ color: 'var(--text)' }}
          >
            <span className="truncate">{opcion.nombre}</span>
            {estaSeleccionada ? (
              <span className="shrink-0 text-[10px] font-medium" style={{ color: 'var(--muted)' }}>✓ Quitar</span>
            ) : mostrandoCarreras ? (
              <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted-2)' }}>Agregar</span>
            ) : (
              <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted-2)' }}>{opcion.total_grupos} grupos</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FuenteSelector;

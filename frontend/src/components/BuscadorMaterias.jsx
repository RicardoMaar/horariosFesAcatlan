import useHorariosStore from '../store/useHorariosStore';

function BuscadorMaterias() {
  const busqueda = useHorariosStore(state => state.busqueda);
  const setBusqueda = useHorariosStore(state => state.setBusqueda);

  return (
    <div className="relative w-full">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
        style={{ color: 'var(--muted)' }}
      >
        ⌕
      </span>
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar materia, profesor o clave…"
        className="w-full text-[13px] outline-none transition-colors"
        style={{
          padding: '9px 32px 9px 32px',
          borderRadius: '11px',
          border: '1px solid var(--border)',
          background: 'var(--surface2)',
          color: 'var(--text)'
        }}
      />
      {busqueda && (
        <button
          onClick={() => setBusqueda('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
          style={{ color: 'var(--muted)' }}
          aria-label="Limpiar búsqueda"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default BuscadorMaterias;

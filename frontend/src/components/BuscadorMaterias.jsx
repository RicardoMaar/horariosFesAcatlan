import useHorariosStore from '../store/useHorariosStore';

function BuscadorMaterias() {
  const busqueda = useHorariosStore(state => state.busqueda);
  const setBusqueda = useHorariosStore(state => state.setBusqueda);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar materia o profesor..."
        className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <svg 
        className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {busqueda && (
        <button
          onClick={() => setBusqueda('')}
          className="absolute right-2 top-2 p-0.5 hover:bg-gray-100 rounded"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default BuscadorMaterias;
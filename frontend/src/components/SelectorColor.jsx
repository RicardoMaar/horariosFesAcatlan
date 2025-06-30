import { useState } from 'react';
import { coloresBase } from '../store/useHorariosStore';

function SelectorColor({ colorActual, onCambiarColor, onCerrar }) {
  const [colorPersonalizado, setColorPersonalizado] = useState(colorActual);
  const [mostrandoPersonalizado, setMostrandoPersonalizado] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Colores predefinidos</h4>
        <div className="grid grid-cols-5 gap-2">
          {coloresBase.map(color => (
            <button
              key={color}
              onClick={() => {
                onCambiarColor(color);
                onCerrar();
              }}
              className={`
                w-8 h-8 rounded-md border-2 transition-all hover:scale-110
                ${colorActual === color ? 'border-gray-600 ring-2 ring-gray-300' : 'border-gray-200'}
              `}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={() => setMostrandoPersonalizado(!mostrandoPersonalizado)}
            className="w-8 h-8 rounded-md border-2 border-dashed border-gray-400 hover:border-gray-600 transition-all hover:scale-110 flex items-center justify-center text-gray-600 hover:text-gray-800"
          >
            +
          </button>
        </div>
      </div>

      {mostrandoPersonalizado && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colorPersonalizado}
              onChange={(e) => setColorPersonalizado(e.target.value)}
              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={colorPersonalizado}
              onChange={(e) => setColorPersonalizado(e.target.value)}
              placeholder="#000000"
              className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onCambiarColor(colorPersonalizado);
                onCerrar();
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Aplicar
            </button>
            <button
              onClick={() => setMostrandoPersonalizado(false)}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectorColor;
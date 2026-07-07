import { useEffect, useState } from 'react';
import { coloresBase } from '../store/useHorariosStore';

function SelectorColor({ colorActual, onCambiarColor, onCerrar }) {
  const colorSeguro = colorActual || coloresBase[0];
  const [colorPersonalizado, setColorPersonalizado] = useState(colorSeguro);
  const [mostrandoPersonalizado, setMostrandoPersonalizado] = useState(false);
  const colorPersonalizadoValido = /^#([0-9a-fA-F]{6})$/.test(colorPersonalizado)
    ? colorPersonalizado
    : colorSeguro;

  useEffect(() => {
    setColorPersonalizado(colorSeguro);
    setMostrandoPersonalizado(false);
  }, [colorSeguro]);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[12px] font-medium mb-2" style={{ color: 'var(--muted)' }}>Colores predefinidos</h4>
        <div className="grid grid-cols-5 gap-2">
          {coloresBase.map(color => (
            <button
              key={color}
              onClick={() => { onCambiarColor(color); onCerrar(); }}
              className="w-8 h-8 rounded-md transition-all hover:scale-110"
              style={{ background: color, border: `2px solid ${colorSeguro === color ? 'var(--text)' : 'var(--border)'}` }}
            />
          ))}
          <button
            onClick={() => setMostrandoPersonalizado(!mostrandoPersonalizado)}
            className="w-8 h-8 rounded-md transition-all hover:scale-110 flex items-center justify-center"
            style={{ border: '2px dashed var(--border)', color: 'var(--muted)' }}
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
              value={colorPersonalizadoValido}
              onChange={(e) => setColorPersonalizado(e.target.value)}
              className="w-12 h-8 rounded cursor-pointer"
              style={{ border: '1px solid var(--border)' }}
            />
            <input
              type="text"
              value={colorPersonalizado}
              onChange={(e) => setColorPersonalizado(e.target.value)}
              placeholder="#000000"
              className="px-2 py-1 rounded text-sm flex-1 outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onCambiarColor(colorPersonalizadoValido); onCerrar(); }}
              className="px-3 py-1 text-sm rounded font-medium"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Aplicar
            </button>
            <button
              onClick={() => setMostrandoPersonalizado(false)}
              className="px-3 py-1 text-sm rounded"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
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

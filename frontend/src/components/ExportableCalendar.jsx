import React from 'react';
import { getVariante } from '../utils/colores';
import { organizarBloquesPorColumnas } from '../utils/calendario';

// Componente que se renderiza fuera de pantalla y se captura con html2canvas.
// Usa colores concretos (tema claro, imprimible): html2canvas no resuelve
// variables CSS ni degradados, por eso todo va en hex y con líneas explícitas.

const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HORA_INICIO = 7;
const HORA_FIN = 23;
const PX = 48; // px por hora

const horaAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

const TOTAL = (HORA_FIN - HORA_INICIO) * PX;

const ExportableCalendar = React.forwardRef(({ materias, coloresAsignados, carrera }, ref) => {
  const horas = [];
  for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
    horas.push(h);
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1120px',
        background: '#F6F4F1',
        padding: '28px',
        fontFamily: 'Figtree, system-ui, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ background: '#FFFFFF', border: '1px solid #EBE6E0', borderRadius: '18px', padding: '22px 24px' }}>
        {/* Encabezado */}
        <div style={{ marginBottom: '18px' }}>
          <h1 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: '22px', color: '#26232B', letterSpacing: '-.01em' }}>
            Horario
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#726C79' }}>
            {carrera ? `Carrera ${carrera}` : 'Mi horario'}
          </p>
        </div>

        {/* Cabecera de días */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)', marginBottom: '4px' }}>
          <div></div>
          {DIAS_NOMBRES.map(dia => (
            <div key={dia} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#726C79', paddingBottom: '8px' }}>
              {dia}
            </div>
          ))}
        </div>

        {/* Rejilla */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)' }}>
          {/* Columna de horas: etiquetas centradas sobre cada línea */}
          <div style={{ position: 'relative', height: `${TOTAL}px` }}>
            {horas.map((h, i) => (
              <div
                key={h}
                style={{ position: 'absolute', top: `${i * PX - 7}px`, right: '8px', fontSize: '11px', color: '#726C79' }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {DIAS.map(dia => {
            const bloques = [];
            materias.forEach(m => (m.horarios || []).forEach(h => {
              if (h.dia === dia) bloques.push({ materia: m, horario: h });
            }));
            // Reparte en columnas los bloques que se traslapan (igual que en pantalla).
            organizarBloquesPorColumnas(bloques);

            return (
              <div key={dia} style={{ position: 'relative', height: `${TOTAL}px`, borderLeft: '1px solid #EBE6E0' }}>
                {/* Líneas fuertes (hora en punto) */}
                {horas.slice(0, -1).map((h, i) => (
                  <div key={`s-${h}`} style={{ position: 'absolute', left: 0, right: 0, top: `${i * PX}px`, borderTop: '1px solid #EBE6E0' }} />
                ))}
                {/* Líneas tenues (media hora) */}
                {horas.slice(0, -1).map((h, i) => (
                  <div key={`f-${h}`} style={{ position: 'absolute', left: 0, right: 0, top: `${i * PX + PX / 2}px`, borderTop: '1px solid #F4F0EB' }} />
                ))}

                {/* Bloques */}
                {bloques.map((bloque, idx) => {
                  const { materia, horario } = bloque;
                  const ini = horaAMinutos(horario.inicio) - HORA_INICIO * 60;
                  const fin = horaAMinutos(horario.fin) - HORA_INICIO * 60;
                  const top = (ini / 60) * PX;
                  const height = ((fin - ini) / 60) * PX - 2;
                  const v = getVariante(coloresAsignados[materia.id], false);
                  const cols = bloque.totalColumnas || 1;
                  const w = 100 / cols;
                  const left = (bloque.columna || 0) * w;

                  return (
                    <div
                      key={`${materia.id}-${idx}`}
                      style={{
                        position: 'absolute',
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${left}% + 3px)`,
                        width: `calc(${w}% - 6px)`,
                        background: v.fill,
                        color: v.text,
                        borderLeft: `3px solid ${v.bar}`,
                        borderRadius: '6px',
                        padding: '4px 7px',
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.15 }}>{materia.nombre}</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85, marginTop: '2px' }}>
                        {horario.inicio}–{horario.fin} · {materia.salon}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ExportableCalendar.displayName = 'ExportableCalendar';

export default ExportableCalendar;


import React from 'react';

const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HORA_INICIO = 7;
const HORA_FIN = 23;

const horaAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

// Usamos `forwardRef` para poder asignarle una ref desde el padre
const ExportableCalendar = React.forwardRef(({ materias, coloresAsignados, carrera }, ref) => {
  
  const horas = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    horas.push(`${h.toString().padStart(2, '0')}:00`);
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: '-9999px', // Lo mandamos fuera de la pantalla
        top: '-9999px',
        width: '1200px',
        backgroundColor: '#ffffff',
        padding: '20px',
        fontFamily: 'Poppins, system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>Horario</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>{carrera || 'Mi Horario'}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(6, 1fr)', border: '1px solid #e5e7eb' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#f9fafb' }}></div>
        {DIAS_NOMBRES.map(dia => (
          <div key={dia} style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '14px', borderLeft: '1px solid #e5e7eb' }}>
            {dia}
          </div>
        ))}
        
        {/* Fila de horas */}
        <div style={{ gridColumn: '1 / 2', borderTop: '1px solid #e5e7eb' }}>
          {horas.map(hora => (
            <div key={hora} style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280', borderTop: '1px solid #f3f4f6' }}>
              {hora}
            </div>
          ))}
        </div>
        
        {/* Celdas para materias */}
        {DIAS.map(dia => (
          <div key={dia} style={{ gridColumnStart: DIAS.indexOf(dia) + 2, gridRowStart: '2', position: 'relative', borderLeft: '1px solid #e5e7eb', borderTop: '1px solid #e5e7eb' }}>
            {horas.map(hora => <div key={hora} style={{ height: '36px', borderTop: '1px solid #f3f4f6' }}></div>)}
            
            {materias
              .filter(m => m.horarios.some(h => h.dia === dia))
              .map(materia => {
                const horario = materia.horarios.find(h => h.dia === dia);
                const inicioMins = horaAMinutos(horario.inicio) - (HORA_INICIO * 60);
                const finMins = horaAMinutos(horario.fin) - (HORA_INICIO * 60);

                const top = (inicioMins / 60) * 36; // 36px por hora
                const height = ((finMins - inicioMins) / 60) * 36;

                return (
                  <div key={materia.id} style={{
                    position: 'absolute',
                    top: `${top}px`,
                    height: `${height - 2}px`, // -2px para un pequeño margen
                    left: '2px',
                    right: '2px',
                    backgroundColor: coloresAsignados[materia.id] || '#3B82F6',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '4px',
                    fontSize: '11px',
                    overflow: 'hidden',
                  }}>
                    <div style={{ fontWeight: '600', lineHeight: '1.2' }}>{materia.nombre}</div>
                    <div style={{ opacity: '0.9', fontSize: '10px' }}>Gpo: {materia.grupo}</div>
                  </div>
                );
              })
            }
          </div>
        ))}
      </div>
    </div>
  );
});

export default ExportableCalendar;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useHorariosStore = create(
  persist(
    (set, get) => ({
      // Estado principal
      carreraSeleccionada: null,
      materiasData: null,
      materiasSeleccionadas: [],
      busqueda: '',
      modalAbierto: false,
      materiaEnModal: null,
      
      // Colores asignados a materias
      coloresAsignados: {},
      
      // Acciones
      setCarrera: (carrera) => set({ 
        carreraSeleccionada: carrera,
        materiasData: null,
        materiasSeleccionadas: [],
        busqueda: '',
        coloresAsignados: {}
      }),
      
      setMateriasData: (data) => set({ materiasData: data }),
      
      setBusqueda: (busqueda) => set({ busqueda }),
      
      toggleMateria: (claveMateria, grupo) => {
        const { materiasSeleccionadas, coloresAsignados } = get();
        const id = `${claveMateria}-${grupo.grupo}`;
        const existe = materiasSeleccionadas.find(m => m.id === id);
        
        if (existe) {
          // Quitar materia
          set({
            materiasSeleccionadas: materiasSeleccionadas.filter(m => m.id !== id)
          });
        } else {
          // Agregar materia con color
          const materia = get().materiasData[claveMateria];
          const nuevoColor = generarColorDeterminista(id, Object.values(coloresAsignados));
          
          set({
            materiasSeleccionadas: [...materiasSeleccionadas, {
              id,
              clave: claveMateria,
              nombre: materia.nombre,
              grupo: grupo.grupo,
              profesor: grupo.profesor,
              salon: grupo.salon,
              horarios: grupo.horarios,
              semestre: materia.semestre
            }],
            coloresAsignados: {
              ...coloresAsignados,
              [id]: nuevoColor
            }
          });
        }
      },
      
      abrirModal: (materiaConGrupo) => set({ 
        modalAbierto: true, 
        materiaEnModal: materiaConGrupo 
      }),
      
      cerrarModal: () => set({ 
        modalAbierto: false, 
        materiaEnModal: null 
      }),
    }),
    {
      name: 'horarios-storage',
      partialize: (state) => ({
        carreraSeleccionada: state.carreraSeleccionada,
        materiasSeleccionadas: state.materiasSeleccionadas,
        coloresAsignados: state.coloresAsignados
      })
    }
  )
);

// Función para generar color determinista basado en el ID
function generarColorDeterminista(id, coloresUsados) {
  const coloresBase = [
    '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];
  
  // Generar un índice basado en el hash del ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Usar el hash para seleccionar un color base
  const indiceBase = Math.abs(hash) % coloresBase.length;
  
  // Intentar usar el color del índice hash
  let colorSeleccionado = coloresBase[indiceBase];
  
  // Si ya está usado, buscar el siguiente disponible
  if (coloresUsados.includes(colorSeleccionado)) {
    // Buscar el primer color no usado
    const colorDisponible = coloresBase.find(c => !coloresUsados.includes(c));
    
    if (colorDisponible) {
      colorSeleccionado = colorDisponible;
    } else {
      // Si todos están usados, generar uno basado en el hash
      const hue = (Math.abs(hash) % 360);
      colorSeleccionado = `hsl(${hue}, 70%, 60%)`;
    }
  }
  
  return colorSeleccionado;
}

// Función de utilidad para detectar traslapes
function hayTraslape(materia1, materia2) {
  for (const h1 of materia1.horarios) {
    for (const h2 of materia2.horarios) {
      if (h1.dia === h2.dia) {
        const inicio1 = timeToMinutes(h1.inicio);
        const fin1 = timeToMinutes(h1.fin);
        const inicio2 = timeToMinutes(h2.inicio);
        const fin2 = timeToMinutes(h2.fin);
        
        if (inicio1 < fin2 && inicio2 < fin1) {
          return true;
        }
      }
    }
  }
  return false;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export default useHorariosStore;
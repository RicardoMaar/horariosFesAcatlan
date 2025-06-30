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
          const nuevoColor = generarColorDeterminista(id);
          
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
      
      cambiarColorMateria: (id, nuevoColor) => {
        const { coloresAsignados } = get();
        set({
          coloresAsignados: {
            ...coloresAsignados,
            [id]: nuevoColor
          }
        });
      },
      
      abrirModal: (materiaConGrupo) => set({ 
        modalAbierto: true, 
        materiaEnModal: materiaConGrupo,
        bloqueModalActivo: materiaConGrupo
      }),
      
      cerrarModal: () => set({ 
        modalAbierto: false, 
        materiaEnModal: null,
        bloqueModalActivo: null
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

// Función para generar color determinista basado SOLO en el ID
function generarColorDeterminista(id) {
  const coloresBase = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  
  // Crear un hash simple del ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  
  // Usar el hash para seleccionar un color
  const colorIndex = Math.abs(hash) % coloresBase.length;
  return coloresBase[colorIndex];
}

export const coloresBase = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default useHorariosStore;
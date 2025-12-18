import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const crearOpcionInicial = () => ({
  id: 'opcion-1',
  nombre: 'Opcion 1',
  materiasSeleccionadas: [],
  coloresAsignados: {}
});

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

      // Opciones de horario (tipo "hojas")
      opciones: [crearOpcionInicial()],
      opcionActivaId: 'opcion-1',

      // Estado para animación de limpieza
      limpiandoHorario: false,
      
      // Acciones
      setCarrera: (carrera) => set(() => {
        const opcionInicial = crearOpcionInicial();
        return { 
          carreraSeleccionada: carrera,
          materiasData: null,
          materiasSeleccionadas: [],
          busqueda: '',
          coloresAsignados: {},
          opciones: [opcionInicial],
          opcionActivaId: opcionInicial.id
        };
      }),
      
      setMateriasData: (data) => set({ materiasData: data }),
      
      setBusqueda: (busqueda) => set({ busqueda }),

      setOpcionActiva: (opcionId) => set((state) => {
        const opcion = state.opciones.find(op => op.id === opcionId);
        if (!opcion) return {};
        return {
          opcionActivaId: opcionId,
          materiasSeleccionadas: opcion.materiasSeleccionadas,
          coloresAsignados: opcion.coloresAsignados
        };
      }),

      agregarOpcion: () => set((state) => {
        const nextNumber = state.opciones.length + 1;
        const nuevaOpcion = {
          id: `opcion-${Date.now()}`,
          nombre: `Opcion ${nextNumber}`,
          materiasSeleccionadas: [],
          coloresAsignados: {}
        };
        return {
          opciones: [...state.opciones, nuevaOpcion],
          opcionActivaId: nuevaOpcion.id,
          materiasSeleccionadas: [],
          coloresAsignados: {}
        };
      }),

      eliminarOpcion: (opcionId) => set((state) => {
        if (state.opciones.length <= 1) {
          return {};
        }
        const index = state.opciones.findIndex(op => op.id === opcionId);
        if (index === -1) return {};

        const nuevasOpciones = state.opciones.filter(op => op.id !== opcionId);
        let nuevaActivaId = state.opcionActivaId;
        let nuevasMaterias = state.materiasSeleccionadas;
        let nuevosColores = state.coloresAsignados;

        if (state.opcionActivaId === opcionId) {
          const fallback = nuevasOpciones[index - 1] || nuevasOpciones[0];
          nuevaActivaId = fallback.id;
          nuevasMaterias = fallback.materiasSeleccionadas;
          nuevosColores = fallback.coloresAsignados;
        }

        return {
          opciones: nuevasOpciones,
          opcionActivaId: nuevaActivaId,
          materiasSeleccionadas: nuevasMaterias,
          coloresAsignados: nuevosColores
        };
      }),
      
      toggleMateria: (claveMateria, grupo) => {
        const { materiasSeleccionadas, coloresAsignados } = get();
        const id = `${claveMateria}-${grupo.grupo}`;
        const existe = materiasSeleccionadas.find(m => m.id === id);
        
        if (existe) {
          // Quitar materia
          const nuevasMaterias = materiasSeleccionadas.filter(m => m.id !== id);
          set((state) => ({
            materiasSeleccionadas: nuevasMaterias,
            opciones: state.opciones.map(op =>
              op.id === state.opcionActivaId
                ? { ...op, materiasSeleccionadas: nuevasMaterias }
                : op
            )
          }));
        } else {
          // Agregar materia con color
          if (materiasSeleccionadas.length >= 12) {
            toast.error('No puedes seleccionar más de 12 materias.');
            return; // Detiene la ejecución si se alcanza el límite
          }
          const materia = get().materiasData[claveMateria];
          const nuevoColor = generarColorDeterminista(id);
          const nuevasMaterias = [...materiasSeleccionadas, {
            id,
            clave: claveMateria,
            nombre: materia.nombre,
            grupo: grupo.grupo,
            profesor: grupo.profesor,
            salon: grupo.salon,
            horarios: grupo.horarios,
            semestre: materia.semestre
          }];
          const nuevosColores = {
            ...coloresAsignados,
            [id]: nuevoColor
          };
          
          set((state) => ({
            materiasSeleccionadas: nuevasMaterias,
            coloresAsignados: nuevosColores,
            opciones: state.opciones.map(op =>
              op.id === state.opcionActivaId
                ? { ...op, materiasSeleccionadas: nuevasMaterias, coloresAsignados: nuevosColores }
                : op
            )
          }));
        }
      },
      
      cambiarColorMateria: (id, nuevoColor) => {
        const { coloresAsignados } = get();
        const nuevosColores = {
          ...coloresAsignados,
          [id]: nuevoColor
        };
        set((state) => ({
          coloresAsignados: nuevosColores,
          opciones: state.opciones.map(op =>
            op.id === state.opcionActivaId
              ? { ...op, coloresAsignados: nuevosColores }
              : op
          )
        }));
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

      limpiarTodasLasMaterias: () => {
        const state = get();
        if (state.materiasSeleccionadas.length === 0) return;
        
        // Marcar que estamos limpiando
        set({ limpiandoHorario: true });
        
        // Hacer transición: primero vaciar materias (esto activa las animaciones de salida)
        set((current) => ({
          materiasSeleccionadas: [],
          opciones: current.opciones.map(op =>
            op.id === current.opcionActivaId
              ? { ...op, materiasSeleccionadas: [] }
              : op
          )
        }));
        
        // Después de que las animaciones terminen, limpiar el resto
        setTimeout(() => {
          set((current) => ({
            coloresAsignados: {},
            opciones: current.opciones.map(op =>
              op.id === current.opcionActivaId
                ? { ...op, coloresAsignados: {} }
                : op
            ),
            modalAbierto: false,
            materiaEnModal: null,
            bloqueModalActivo: null,
            limpiandoHorario: false
          }));
        }, 600); // Tiempo suficiente para las animaciones (400ms + margen)
      },
    }),
    {
      name: 'horarios-storage',
      version: 2,
      migrate: (state, version) => {
        if (!state) return state;
        if (version < 2) {
          const opcionInicial = crearOpcionInicial();
          const materiasSeleccionadas = state.materiasSeleccionadas || [];
          const coloresAsignados = state.coloresAsignados || {};
          const opciones = [{
            ...opcionInicial,
            materiasSeleccionadas,
            coloresAsignados
          }];
          return {
            ...state,
            opciones,
            opcionActivaId: opcionInicial.id,
            materiasSeleccionadas,
            coloresAsignados
          };
        }
        return state;
      },
      partialize: (state) => ({
        carreraSeleccionada: state.carreraSeleccionada,
        materiasSeleccionadas: state.materiasSeleccionadas,
        coloresAsignados: state.coloresAsignados,
        opciones: state.opciones,
        opcionActivaId: state.opcionActivaId
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

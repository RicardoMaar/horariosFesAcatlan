import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { construirFuenteCarrera, getSelectionId } from '../utils/fuentes';

const crearOpcionInicial = () => ({
  id: 'opcion-1',
  nombre: 'Opcion 1',
  fuentes: [],
  materiasSeleccionadas: [],
  coloresAsignados: {}
});

const useHorariosStore = create(
  persist(
    (set, get) => ({
      // Estado principal
      carreraSeleccionada: null,
      fuentesSeleccionadas: [],
      fuenteActivaId: null,
      fuentesDatos: {},
      materiasData: null,
      anomaliasData: null,
      materiasSeleccionadas: [],
      busqueda: '',
      modalAbierto: false,
      materiaEnModal: null,
      
      // Colores asignados a materias
      coloresAsignados: {},

      // Opciones de horario (tipo "hojas")
      opciones: [crearOpcionInicial()],
      opcionActivaId: 'opcion-1',
      fuentesInicializadas: false,

      // Estado para animación de limpieza
      limpiandoHorario: false,
      
      // Acciones
      setCarrera: (carrera) => {
        const fuente = construirFuenteCarrera(carrera, { nombre: carrera });
        get().agregarFuente(fuente);
      },

      agregarFuente: (fuente) => set((state) => {
        const existente = state.fuentesSeleccionadas.find((item) => item.id === fuente.id);
        if (existente) {
          const datos = state.fuentesDatos[fuente.id];
          return {
            fuenteActivaId: fuente.id,
            carreraSeleccionada: fuente.tipo === 'carrera' ? fuente.codigo : null,
            materiasData: datos?.materiasData || null,
            anomaliasData: datos?.anomaliasData || null,
            fuentesInicializadas: true
          };
        }

        const carreras = state.fuentesSeleccionadas.filter((item) => item.tipo === 'carrera').length;
        const idiomas = state.fuentesSeleccionadas.filter((item) => item.tipo === 'idioma').length;
        if (fuente.tipo === 'carrera' && carreras >= 2) {
          toast.error('Puedes combinar hasta 2 carreras.');
          return {};
        }
        if (fuente.tipo === 'idioma' && idiomas >= 3) {
          toast.error('Puedes combinar hasta 3 idiomas.');
          return {};
        }

        const nuevasFuentes = [...state.fuentesSeleccionadas, fuente];
        return {
          fuentesSeleccionadas: nuevasFuentes,
          fuenteActivaId: fuente.id,
          carreraSeleccionada: fuente.tipo === 'carrera' ? fuente.codigo : null,
          materiasData: null,
          anomaliasData: null,
          busqueda: '',
          fuentesInicializadas: true,
          opciones: state.opciones.map((opcion) => (
            opcion.id === state.opcionActivaId
              ? { ...opcion, fuentes: nuevasFuentes }
              : opcion
          ))
        };
      }),

      actualizarFuente: (fuente) => set((state) => {
        const actualizar = (item) => item.id === fuente.id ? { ...item, ...fuente } : item;
        const fuentesSeleccionadas = state.fuentesSeleccionadas.map(actualizar);
        return {
          fuentesSeleccionadas,
          opciones: state.opciones.map((opcion) => ({
            ...opcion,
            fuentes: (opcion.fuentes || []).map(actualizar)
          }))
        };
      }),

      setFuenteActiva: (fuenteId) => set((state) => {
        const fuente = state.fuentesSeleccionadas.find((item) => item.id === fuenteId);
        const datos = state.fuentesDatos[fuenteId];
        return {
          fuenteActivaId: fuenteId,
          carreraSeleccionada: fuente?.tipo === 'carrera' ? fuente.codigo : null,
          materiasData: datos?.materiasData || null,
          anomaliasData: datos?.anomaliasData || null,
          busqueda: ''
        };
      }),

      quitarFuente: (fuenteId) => set((state) => {
        if (!state.fuentesSeleccionadas.some((fuente) => fuente.id === fuenteId)) return {};
        const restantes = state.fuentesSeleccionadas.filter((item) => item.id !== fuenteId);
        const siguiente = restantes.find((item) => item.id === state.fuenteActivaId) || restantes[0] || null;
        const datos = siguiente ? state.fuentesDatos[siguiente.id] : null;
        const filtrarSeleccionadas = (materias) => materias.filter((materia) => materia.fuenteId !== fuenteId);
        const materiasSeleccionadas = filtrarSeleccionadas(state.materiasSeleccionadas);
        const coloresAsignados = Object.fromEntries(Object.entries(state.coloresAsignados).filter(([id]) => !id.startsWith(`${fuenteId}:`)));
        const nuevasOpciones = state.opciones.map((opcion) => (
          opcion.id === state.opcionActivaId
            ? {
              ...opcion,
              fuentes: restantes,
              materiasSeleccionadas,
              coloresAsignados
            }
            : opcion
        ));
        return {
          fuentesSeleccionadas: restantes,
          fuenteActivaId: siguiente?.id || null,
          carreraSeleccionada: siguiente?.tipo === 'carrera' ? siguiente.codigo : null,
          materiasData: datos?.materiasData || null,
          anomaliasData: datos?.anomaliasData || null,
          materiasSeleccionadas,
          opciones: nuevasOpciones,
          coloresAsignados
        };
      }),

      setFuenteDatos: (fuenteId, materiasData, anomaliasData = {}) => set((state) => ({
        fuentesDatos: {
          ...state.fuentesDatos,
          [fuenteId]: { materiasData, anomaliasData }
        },
        ...(state.fuenteActivaId === fuenteId ? { materiasData, anomaliasData } : {})
      })),
      
      setMateriasData: (data) => set({ materiasData: data }),

      setAnomaliasData: (data) => set({ anomaliasData: data }),
      
      setBusqueda: (busqueda) => set({ busqueda }),

      setOpcionActiva: (opcionId) => set((state) => {
        const opcion = state.opciones.find(op => op.id === opcionId);
        if (!opcion) return {};
        const fuentes = opcion.fuentes || [];
        const fuenteActiva = fuentes.find((fuente) => fuente.id === state.fuenteActivaId) || fuentes[0] || null;
        const datos = fuenteActiva ? state.fuentesDatos[fuenteActiva.id] : null;
        return {
          opcionActivaId: opcionId,
          fuentesSeleccionadas: fuentes,
          fuenteActivaId: fuenteActiva?.id || null,
          carreraSeleccionada: fuenteActiva?.tipo === 'carrera' ? fuenteActiva.codigo : null,
          materiasData: datos?.materiasData || null,
          anomaliasData: datos?.anomaliasData || null,
          materiasSeleccionadas: opcion.materiasSeleccionadas,
          coloresAsignados: opcion.coloresAsignados,
          busqueda: ''
        };
      }),

      agregarOpcion: () => set((state) => {
        const nextNumber = state.opciones.length + 1;
        const nuevaOpcion = {
          id: `opcion-${Date.now()}`,
          nombre: `Opcion ${nextNumber}`,
          fuentes: state.fuentesSeleccionadas,
          materiasSeleccionadas: [],
          coloresAsignados: {}
        };
        const fuenteActiva = state.fuentesSeleccionadas.find((fuente) => fuente.id === state.fuenteActivaId) || state.fuentesSeleccionadas[0] || null;
        const datos = fuenteActiva ? state.fuentesDatos[fuenteActiva.id] : null;
        return {
          opciones: [...state.opciones, nuevaOpcion],
          opcionActivaId: nuevaOpcion.id,
          fuentesSeleccionadas: nuevaOpcion.fuentes,
          fuenteActivaId: fuenteActiva?.id || null,
          carreraSeleccionada: fuenteActiva?.tipo === 'carrera' ? fuenteActiva.codigo : null,
          materiasData: datos?.materiasData || null,
          anomaliasData: datos?.anomaliasData || null,
          busqueda: '',
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

        const opcionActiva = nuevasOpciones.find((opcion) => opcion.id === nuevaActivaId);
        const fuentes = opcionActiva?.fuentes || [];
        const fuenteActiva = fuentes.find((fuente) => fuente.id === state.fuenteActivaId) || fuentes[0] || null;
        const datos = fuenteActiva ? state.fuentesDatos[fuenteActiva.id] : null;

        return {
          opciones: nuevasOpciones,
          opcionActivaId: nuevaActivaId,
          fuentesSeleccionadas: fuentes,
          fuenteActivaId: fuenteActiva?.id || null,
          carreraSeleccionada: fuenteActiva?.tipo === 'carrera' ? fuenteActiva.codigo : null,
          materiasData: datos?.materiasData || null,
          anomaliasData: datos?.anomaliasData || null,
          materiasSeleccionadas: nuevasMaterias,
          coloresAsignados: nuevosColores
        };
      }),
      
      toggleMateria: (claveMateria, grupo) => {
        const { materiasSeleccionadas, coloresAsignados } = get();
        const materia = get().materiasData?.[claveMateria];
        if (!materia) return;
        const id = getSelectionId(materia, grupo);
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
          const nuevoColor = generarColorDeterminista(id);
          const nuevasMaterias = [...materiasSeleccionadas, {
            id,
            clave: claveMateria,
            nombre: materia.nombre,
            grupo: grupo.grupo,
            profesor: grupo.profesor,
            salon: grupo.salon,
            horarios: grupo.horarios,
            semestre: materia.semestre,
            fuenteId: grupo.fuenteId || materia.fuenteId || get().fuenteActivaId,
            fuenteTipo: grupo.fuenteTipo || materia.fuenteTipo,
            fuenteNombre: grupo.fuenteNombre || materia.fuenteNombre
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
      
      abrirModal: (materiaConGrupo) => set((state) => {
        const actual = state.materiaEnModal;
        const mismoId = actual?.id && materiaConGrupo?.id && actual.id === materiaConGrupo.id;
        const mismoGrupo = actual?.grupo && materiaConGrupo?.grupo && actual.grupo === materiaConGrupo.grupo;
        if (state.modalAbierto && mismoId && (mismoGrupo || !materiaConGrupo?.grupo)) {
          return {};
        }
        return {
          modalAbierto: true,
          materiaEnModal: materiaConGrupo,
          bloqueModalActivo: materiaConGrupo
        };
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
      version: 4,
      migrate: (state, version) => {
        if (!state) return state;
        let migrated = state;

        if (version < 2) {
          const opcionInicial = crearOpcionInicial();
          const materiasSeleccionadas = state.materiasSeleccionadas || [];
          const coloresAsignados = state.coloresAsignados || {};
          const legacyFuente = state.carreraSeleccionada
            ? construirFuenteCarrera(state.carreraSeleccionada, { nombre: state.carreraSeleccionada })
            : null;
          const opciones = [{
            ...opcionInicial,
            fuentes: legacyFuente ? [legacyFuente] : [],
            materiasSeleccionadas,
            coloresAsignados
          }];
          migrated = {
            ...migrated,
            opciones,
            opcionActivaId: opcionInicial.id,
            materiasSeleccionadas,
            coloresAsignados,
            fuentesSeleccionadas: legacyFuente ? [legacyFuente] : [],
            fuenteActivaId: legacyFuente?.id || null,
            fuentesDatos: {},
            fuentesInicializadas: Boolean(legacyFuente)
          };
        }

        if (version < 3) {
          const legacyFuente = migrated.carreraSeleccionada
            ? construirFuenteCarrera(migrated.carreraSeleccionada, { nombre: migrated.carreraSeleccionada })
            : null;
          migrated = {
            ...migrated,
            fuentesSeleccionadas: migrated.fuentesSeleccionadas?.length
              ? migrated.fuentesSeleccionadas
              : (legacyFuente ? [legacyFuente] : []),
            fuenteActivaId: migrated.fuenteActivaId || legacyFuente?.id || null,
            fuentesDatos: migrated.fuentesDatos || {},
            fuentesInicializadas: migrated.fuentesInicializadas ?? Boolean(migrated.fuentesSeleccionadas?.length || legacyFuente)
          };
        }

        if (version < 4) {
          const fuentesGlobales = migrated.fuentesSeleccionadas || [];
          const opciones = (migrated.opciones?.length ? migrated.opciones : [crearOpcionInicial()]).map((opcion) => ({
            ...opcion,
            fuentes: Array.isArray(opcion.fuentes) ? opcion.fuentes : fuentesGlobales
          }));
          const opcionActiva = opciones.find((opcion) => opcion.id === migrated.opcionActivaId) || opciones[0];
          migrated = {
            ...migrated,
            opciones,
            opcionActivaId: opcionActiva.id,
            fuentesSeleccionadas: opcionActiva.fuentes || fuentesGlobales,
            fuentesInicializadas: migrated.fuentesInicializadas ?? Boolean(fuentesGlobales.length)
          };
        }

        return migrated;
      },
      partialize: (state) => ({
        carreraSeleccionada: state.carreraSeleccionada,
        fuentesSeleccionadas: state.fuentesSeleccionadas,
        fuenteActivaId: state.fuenteActivaId,
        materiasSeleccionadas: state.materiasSeleccionadas,
        coloresAsignados: state.coloresAsignados,
        opciones: state.opciones,
        opcionActivaId: state.opcionActivaId,
        fuentesInicializadas: state.fuentesInicializadas
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

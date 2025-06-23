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
          const nuevoColor = generarColorUnico(Object.values(coloresAsignados));
          
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
      
      // Getters computados
      getMateriasConTraslape: () => {
        const { materiasSeleccionadas } = get();
        const traslapes = new Set();
        
        for (let i = 0; i < materiasSeleccionadas.length; i++) {
          for (let j = i + 1; j < materiasSeleccionadas.length; j++) {
            if (hayTraslape(materiasSeleccionadas[i], materiasSeleccionadas[j])) {
              traslapes.add(materiasSeleccionadas[i].id);
              traslapes.add(materiasSeleccionadas[j].id);
            }
          }
        }
        
        return traslapes;
      },
      
      getMateriasFiltradas: () => {
        const { materiasData, busqueda } = get();
        if (!materiasData || !busqueda) return materiasData;
        
        const busquedaNorm = normalizar(busqueda);
        const filtradas = {};
        
        Object.entries(materiasData).forEach(([clave, materia]) => {
          const coincideNombre = normalizar(materia.nombre).includes(busquedaNorm);
          const coincideProfesor = materia.grupos.some(g => 
            normalizar(g.profesor).includes(busquedaNorm)
          );
          
          if (coincideNombre || coincideProfesor) {
            filtradas[clave] = materia;
          }
        });
        
        return filtradas;
      }
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

// Utilidades
function normalizar(texto) {
  return texto.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

function generarColorUnico(coloresUsados) {
  const coloresBase = [
    '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];
  
  const disponibles = coloresBase.filter(c => !coloresUsados.includes(c));
  
  if (disponibles.length > 0) {
    return disponibles[0];
  }
  
  // Si se acabaron los colores predefinidos, generar uno aleatorio
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
}

export default useHorariosStore;
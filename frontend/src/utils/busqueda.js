export const normalizarTexto = (texto) => {
    return texto.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };
  
  export const filtrarMaterias = (materiasData, busqueda) => {
    if (!materiasData || !busqueda) return materiasData;
    
    const busquedaNorm = normalizarTexto(busqueda);
    const filtradas = {};
    
    Object.entries(materiasData).forEach(([clave, materia]) => {
      const nombreNorm = normalizarTexto(materia.nombre);
      const coincideNombre = nombreNorm.includes(busquedaNorm);
      
      const gruposFiltrados = materia.grupos.filter(g => {
        const profNorm = normalizarTexto(g.profesor);
        return profNorm.includes(busquedaNorm);
      });
      
      if (coincideNombre) {
        filtradas[clave] = materia;
      } else if (gruposFiltrados.length > 0) {
        filtradas[clave] = {
          ...materia,
          grupos: gruposFiltrados
        };
      }
    });
    
    return filtradas;
  };
  
  export const agruparMateriasPorSemestre = (materias) => {
    if (!materias) return {};
    
    const agrupadas = {};
    
    Object.entries(materias).forEach(([clave, materia]) => {
      const semestre = materia.semestre || '00';
      if (!agrupadas[semestre]) {
        agrupadas[semestre] = [];
      }
      agrupadas[semestre].push({ clave, ...materia });
    });
  
    return Object.keys(agrupadas)
      .sort((a, b) => {
        if (a === '40') return 1;
        if (b === '40') return -1;
        return parseInt(a) - parseInt(b);
      })
      .reduce((acc, key) => {
        acc[key] = agrupadas[key].sort((a, b) => a.nombre.localeCompare(b.nombre));
        return acc;
      }, {});
  };
import { useState, useEffect } from 'react';

export function useExpansionStates(busqueda, materiasFiltradas) {
  const [semestresExpandidos, setSemestresExpandidos] = useState({});
  const [materiasExpandidas, setMateriasExpandidas] = useState({});

  useEffect(() => {
    if (busqueda && materiasFiltradas) {
      const nuevosSemestres = {};
      const nuevasMaterias = {};
      
      Object.entries(materiasFiltradas).forEach(([clave, materia]) => {
        const semestre = materia.semestre || '00';
        nuevosSemestres[semestre] = true;
        nuevasMaterias[clave] = true;
      });
      
      setSemestresExpandidos(nuevosSemestres);
      setMateriasExpandidas(nuevasMaterias);
    } else if (!busqueda) {
      setSemestresExpandidos({});
      setMateriasExpandidas({});
    }
  }, [busqueda, materiasFiltradas]);

  const toggleSemestre = (semestre) => {
    setSemestresExpandidos(prev => {
      const estaAbierto = prev[semestre];
      return estaAbierto ? {} : { [semestre]: true };
    });
    setMateriasExpandidas({});
  };

  const toggleMateriaClave = (clave) => {
    setMateriasExpandidas(prev => {
      const estaAbierto = prev[clave];
      return estaAbierto ? {} : { [clave]: true };
    });
  };

  return {
    semestresExpandidos,
    materiasExpandidas,
    toggleSemestre,
    toggleMateriaClave
  };
}
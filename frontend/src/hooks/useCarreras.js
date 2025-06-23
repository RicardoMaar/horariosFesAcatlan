import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useIndexedDB } from './useIndexedDB';
import useHorariosStore from '../store/useHorariosStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function useCarreras() {
  const [carreras, setCarreras] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('useCarreras: iniciando fetch');
    fetchCarreras();
  }, []);

  const fetchCarreras = async () => {
    try {
      setLoading(true);
      console.log('Fetching carreras from:', `${API_BASE}/carreras`);
      const response = await axios.get(`${API_BASE}/carreras`);
      console.log('Carreras recibidas:', response.data);
      setCarreras(response.data);
      setError(null);
    } catch (err) {
      console.error('Error cargando carreras:', err);
      setError(err.message);
      toast.error('Error cargando carreras');
    } finally {
      setLoading(false);
    }
  };

  return { carreras, loading, error, refetch: fetchCarreras };
}

export function useHorarios(carreraCodigo) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { saveCarrera, loadCarrera } = useIndexedDB();
  const setMateriasData = useHorariosStore(state => state.setMateriasData);

  const fetchHorarios = useCallback(async () => {
    if (!carreraCodigo) {
      console.log('useHorarios: no hay carrera seleccionada');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching horarios para carrera:', carreraCodigo);

      // Intentar cargar desde cache
      const cached = await loadCarrera(carreraCodigo);
      if (cached) {
        console.log('Horarios cargados desde cache');
        setMateriasData(cached.materias);
        toast.success('Horarios cargados desde cache', { duration: 2000 });
        return;
      }

      // Si no hay cache, hacer petición
      console.log('No hay cache, fetching desde API');
      const response = await axios.get(`${API_BASE}/horarios/${carreraCodigo}`);
      const data = response.data;
      console.log('Horarios recibidos:', { 
        carrera: data.nombre, 
        materias: Object.keys(data.materias || {}).length 
      });
      
      setMateriasData(data.materias);
      
      // Guardar en cache
      await saveCarrera(carreraCodigo, data);
      
      toast.success('Horarios cargados correctamente');
    } catch (err) {
      console.error('Error cargando horarios:', err);
      setError(err.message);
      toast.error('Error cargando horarios');
    } finally {
      setLoading(false);
    }
  }, [carreraCodigo, setMateriasData, saveCarrera, loadCarrera]);

  useEffect(() => {
    if (carreraCodigo) {
      fetchHorarios();
    }
  }, [carreraCodigo, fetchHorarios]);

  return { loading, error, refetch: fetchHorarios };
}
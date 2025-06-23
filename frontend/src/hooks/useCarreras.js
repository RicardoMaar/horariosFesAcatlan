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
    fetchCarreras();
  }, []);

  const fetchCarreras = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/carreras`);
      setCarreras(response.data);
      setError(null);
    } catch (err) {
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
    if (!carreraCodigo) return;

    try {
      setLoading(true);
      setError(null);

      // Intentar cargar desde cache
      const cached = await loadCarrera(carreraCodigo);
      if (cached) {
        setMateriasData(cached.materias);
        toast.success('Horarios cargados desde cache', { duration: 2000 });
        return;
      }

      // Si no hay cache, hacer petición
      const response = await axios.get(`${API_BASE}/horarios/${carreraCodigo}`);
      const data = response.data;
      
      setMateriasData(data.materias);
      
      // Guardar en cache
      await saveCarrera(carreraCodigo, data);
      
      toast.success('Horarios cargados correctamente');
    } catch (err) {
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
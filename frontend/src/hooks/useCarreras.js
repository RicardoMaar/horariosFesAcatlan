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
    // console.log('useCarreras: iniciando fetch');
    fetchCarreras();
  }, []);

  const fetchCarreras = async () => {
    try {
      setLoading(true);
      // console.log('Fetching carreras from:', `${API_BASE}/carreras`);
      const response = await axios.get(`${API_BASE}/carreras`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      // console.log('Carreras recibidas:', response.data);
      setCarreras(response.data);
      setError(null);
    } catch (err) {
      // console.error('Error cargando carreras:', err);
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
  const setMateriasData = useHorariosStore(state => state.setMateriasData);

  const fetchHorarios = useCallback(async () => {
    if (!carreraCodigo) {
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      // ✅ SIEMPRE hacer petición al servidor
      console.log('Fetching desde API');
      const timestamp = Date.now(); 
      const response = await axios.get(`${API_BASE}/horarios/${carreraCodigo}?t=${timestamp}`);
      
      const data = response.data;
      
      setMateriasData(data.materias);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [carreraCodigo, setMateriasData]); // ← También quitar saveCarrera, loadCarrera de dependencies

  useEffect(() => {
    if (carreraCodigo) {
      fetchHorarios();
    }
  }, [carreraCodigo, fetchHorarios]);

  return { loading, error, refetch: fetchHorarios };
}
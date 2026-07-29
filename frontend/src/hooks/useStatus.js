import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../constants/api';

export function useStatus() {
  const [fechaActualizacion, setFechaActualizacion] = useState(null);
  const [fechaCarreras, setFechaCarreras] = useState(null);
  const [fechaIdiomas, setFechaIdiomas] = useState(null);
  const [periodoIdiomas, setPeriodoIdiomas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/status`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const fechaCarrerasResponse = response.data?.fecha_actualizacion || null;
      const fechaIdiomasResponse = response.data?.fecha_idiomas || null;
      const fechas = [fechaCarrerasResponse, fechaIdiomasResponse]
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      setFechaCarreras(fechaCarrerasResponse);
      setFechaIdiomas(fechaIdiomasResponse);
      setPeriodoIdiomas(response.data?.periodo_idiomas || null);
      setFechaActualizacion(fechas[0] || null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error cargando status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    fechaActualizacion,
    fechaCarreras,
    fechaIdiomas,
    periodoIdiomas,
    loading,
    error,
    refetch: fetchStatus
  };
}

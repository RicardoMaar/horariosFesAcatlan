import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../constants/api';

export function useStatus() {
  const [fechaActualizacion, setFechaActualizacion] = useState(null);
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
      setFechaActualizacion(response.data?.fecha_actualizacion || null);
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
    loading,
    error,
    refetch: fetchStatus
  };
}

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useHorariosStore from '../store/useHorariosStore';
import { API_BASE } from '../constants/api';
import { normalizarCarrera, normalizarIdioma } from '../utils/fuentes';

export function useFuentesCatalogo() {
  const [carreras, setCarreras] = useState(null);
  const [idiomas, setIdiomas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCatalogos = useCallback(async () => {
    try {
      setLoading(true);
      const [carrerasResponse, idiomasResponse] = await Promise.all([
        axios.get(`${API_BASE}/carreras`),
        axios.get(`${API_BASE}/idiomas`)
      ]);
      // Acepta ambos formatos para tolerar despliegues/API antiguos durante la transición.
      setCarreras(carrerasResponse.data?.carreras || carrerasResponse.data || {});
      setIdiomas(idiomasResponse.data?.idiomas || idiomasResponse.data || {});
      setError(null);
    } catch (err) {
      setError(err.message || 'Error cargando fuentes');
      toast.error('No se pudieron cargar carreras e idiomas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogos();
  }, [fetchCatalogos]);

  return { carreras, idiomas, loading, error, refetch: fetchCatalogos };
}

export function useFuenteData() {
  const fuenteActivaId = useHorariosStore((state) => state.fuenteActivaId);
  const fuentesSeleccionadas = useHorariosStore((state) => state.fuentesSeleccionadas);
  const setFuenteDatos = useHorariosStore((state) => state.setFuenteDatos);

  useEffect(() => {
    const fuente = fuentesSeleccionadas.find((item) => item.id === fuenteActivaId);
    if (!fuente) return undefined;

    const cached = useHorariosStore.getState().fuentesDatos[fuente.id];
    if (cached) {
      setFuenteDatos(fuente.id, cached.materiasData, cached.anomaliasData);
      return undefined;
    }

    let cancelled = false;
    const timestamp = Date.now();

    const cargarFuente = async () => {
      try {
        let materiasData;
        let anomaliasData = {};
        let metadata = {};

        if (fuente.tipo === 'carrera') {
          const response = await axios.get(`${API_BASE}/horarios/${fuente.codigo}?t=${timestamp}`);
          materiasData = normalizarCarrera(response.data, fuente);
          metadata = {
            fechaActualizacion: response.data?.fecha_consulta,
            periodo: response.data?.periodo
          };
          try {
            const anomaliasResponse = await axios.get(`${API_BASE}/anomalias/${fuente.codigo}?t=${timestamp}`);
            anomaliasData = anomaliasResponse.data?.materias || {};
          } catch {
            anomaliasData = {};
          }
        } else {
          const response = await axios.get(`${API_BASE}/idiomas/${fuente.codigo}?t=${timestamp}`);
          materiasData = normalizarIdioma(response.data, fuente);
          metadata = {
            fechaActualizacion: response.data?.fecha_consulta,
            periodo: response.data?.periodo
          };
        }

        if (!cancelled) {
          setFuenteDatos(fuente.id, materiasData, anomaliasData);
          if (metadata.fechaActualizacion || metadata.periodo) {
            useHorariosStore.getState().actualizarFuente({ id: fuente.id, ...metadata });
          }
        }
      } catch {
        if (!cancelled) {
          setFuenteDatos(fuente.id, {}, {});
          toast.error(`No se pudo cargar ${fuente.nombre}`);
        }
      }
    };

    cargarFuente();
    return () => {
      cancelled = true;
    };
  }, [fuenteActivaId, fuentesSeleccionadas, setFuenteDatos]);

  return {
    loading: Boolean(fuenteActivaId && !useHorariosStore.getState().fuentesDatos[fuenteActivaId])
  };
}

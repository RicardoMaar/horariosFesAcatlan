import { openDB } from 'idb';
import { useCallback } from 'react';

const DB_NAME = 'HorariosAcatlan';
const DB_VERSION = 1;
const STORE_NAME = 'carreras';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

export function useIndexedDB() {
  const getDB = useCallback(async () => {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'codigo' });
        }
      },
    });
  }, []);

  const saveCarrera = useCallback(async (codigo, data) => {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, {
        codigo,
        data,
        timestamp: Date.now(),
      });
      console.log(`✅ Carrera ${codigo} guardada en IndexedDB`);
    } catch (error) {
      console.error('Error guardando en IndexedDB:', error);
    }
  }, [getDB]);

  const loadCarrera = useCallback(async (codigo) => {
    try {
      const db = await getDB();
      const cached = await db.get(STORE_NAME, codigo);
      
      if (!cached) {
        console.log(`❌ Carrera ${codigo} no encontrada en cache`);
        return null;
      }
      
      const age = Date.now() - cached.timestamp;
      if (age > CACHE_DURATION) {
        console.log(`⏰ Cache expirado para carrera ${codigo}`);
        await db.delete(STORE_NAME, codigo);
        return null;
      }
      
      console.log(`✅ Carrera ${codigo} cargada desde cache`);
      return cached.data;
    } catch (error) {
      console.error('Error leyendo de IndexedDB:', error);
      return null;
    }
  }, [getDB]);

  const clearCache = useCallback(async () => {
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await tx.objectStore(STORE_NAME).clear();
      console.log('🧹 Cache limpiado');
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  }, [getDB]);

  const getCacheInfo = useCallback(async () => {
    try {
      const db = await getDB();
      const keys = await db.getAllKeys(STORE_NAME);
      const items = await db.getAll(STORE_NAME);
      
      const info = items.map(item => ({
        codigo: item.codigo,
        nombre: item.data.nombre,
        size: JSON.stringify(item.data).length,
        age: Math.floor((Date.now() - item.timestamp) / 1000 / 60), // minutos
        expired: Date.now() - item.timestamp > CACHE_DURATION
      }));
      
      return {
        count: keys.length,
        totalSize: info.reduce((sum, item) => sum + item.size, 0),
        items: info
      };
    } catch (error) {
      console.error('Error obteniendo info del cache:', error);
      return null;
    }
  }, [getDB]);

  return {
    saveCarrera,
    loadCarrera,
    clearCache,
    getCacheInfo
  };
}
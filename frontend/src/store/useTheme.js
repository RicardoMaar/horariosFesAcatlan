import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'tema-storage';

// Preferencia inicial: lo guardado gana; si no hay nada, se respeta el tema del sistema.
const getInitialDark = () => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.state?.dark === 'boolean') {
        return parsed.state.dark;
      }
    }
  } catch {
    // ignorar JSON inválido
  }
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
};

const aplicarTema = (dark) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }
};

const useTheme = create(
  persist(
    (set, get) => ({
      dark: getInitialDark(),
      toggle: () => {
        const next = !get().dark;
        aplicarTema(next);
        set({ dark: next });
      },
      setDark: (dark) => {
        aplicarTema(dark);
        set({ dark });
      }
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        aplicarTema(state ? state.dark : getInitialDark());
      }
    }
  )
);

// Aplicar el tema lo antes posible para evitar parpadeo.
aplicarTema(getInitialDark());

export default useTheme;

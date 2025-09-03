import { useEffect } from "react";
import { useUiStore, themes } from "../app/store/useUiStore";

/**
 * Hook personalizado para gestión global de temas
 * Se ejecuta una vez al cargar la aplicación para aplicar el tema guardado
 */
export function useTheme() {
  const { currentTheme, setTheme } = useUiStore();

  // Aplicar el tema al cargar la aplicación
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme.id);
  }, [currentTheme.id]);

  return {
    currentTheme,
    setTheme,
    themes,
  };
}

/**
 * Hook que debe ejecutarse una sola vez en el root de la aplicación
 * para inicializar el tema desde localStorage
 */
export function useInitializeTheme() {
  useEffect(() => {
    const savedThemeId = localStorage.getItem("theme") || "system";
    const savedTheme =
      themes.find((theme) => theme.id === savedThemeId) || themes[0];

    // Aplicar el tema inmediatamente
    document.documentElement.setAttribute("data-theme", savedTheme.id);

    // Actualizar el store si es necesario
    const currentThemeInStore = useUiStore.getState().currentTheme;
    if (currentThemeInStore.id !== savedTheme.id) {
      useUiStore.getState().setTheme(savedTheme);
    }
  }, []);
}

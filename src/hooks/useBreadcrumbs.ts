import { useEffect } from "react";
import { useUiStore, type BreadcrumbItem } from "../app/store/useUiStore";

/**
 * Hook personalizado para manejar breadcrumbs
 * @param breadcrumbs - Array de elementos de breadcrumb
 *
 * @example
 * useBreadcrumbs([
 *   { label: "Inicio", href: "/", icon: "🏠" },
 *   { label: "Categorías", href: "/categories", icon: "📦" },
 *   { label: "Categoría Actual" }
 * ]);
 */
export function useBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const setBreadcrumbs = useUiStore((state) => state.setBreadcrumbs);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
  }, [breadcrumbs, setBreadcrumbs]);

  useEffect(() => {
    return () => {
      useUiStore.getState().clearBreadcrumbs();
    };
  }, []);
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string | React.ReactNode;
}

export interface Theme {
  id: string;
  name: string;
}

export const themes: Theme[] = [
  { id: "system", name: "System" },
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "dracula", name: "Dracula" },
  { id: "black", name: "Black" },
  { id: "cupcake", name: "Cupcake" },
];

interface UiState {
  productsPageSize: number;
  isSidebarOpen: boolean;
  breadcrumbs: BreadcrumbItem[];
  currentTheme: Theme;
  setProductsPageSize: (size: number) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleIsSidebarOpen: () => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      productsPageSize: 5, // valor inicial
      isSidebarOpen: true,
      breadcrumbs: [],
      currentTheme:
        themes.find(
          (theme) => theme.id === (localStorage.getItem("theme") || "system")
        ) || themes[0],
      setProductsPageSize: (size) => set({ productsPageSize: size }),
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleIsSidebarOpen: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      addBreadcrumb: (breadcrumb) =>
        set((state) => ({ breadcrumbs: [...state.breadcrumbs, breadcrumb] })),
      clearBreadcrumbs: () => set({ breadcrumbs: [] }),
      setTheme: (theme) => {
        // Aplicar el tema inmediatamente al DOM
        document.documentElement.setAttribute("data-theme", theme.id);
        localStorage.setItem("theme", theme.id);
        set({ currentTheme: theme });
      },
    }),
    {
      name: "ui-store", // clave en localStorage
      partialize: (state) => ({
        productsPageSize: state.productsPageSize,
        isSidebarOpen: state.isSidebarOpen,
        currentTheme: state.currentTheme, // Persistir el tema
        // No persistimos breadcrumbs porque son específicos de la sesión
      }),
    }
  )
);

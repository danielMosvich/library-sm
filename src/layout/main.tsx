import { Outlet } from "react-router";
import Navbar from "../components/Navbar";
import Breadcrumbs from "../components/Breadcrumbs";
import { useInitializeTheme } from "../hooks/useTheme";

export default function MainLayout() {
  // Inicializar el tema globalmente
  useInitializeTheme();

  return (
    <div className="flex">
      <Navbar />
      <main className="w-full overflow-auto max-h-screen p-2 md:p-5">
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
}

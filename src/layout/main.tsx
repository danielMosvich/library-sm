import { Outlet } from "react-router";
import Navbar from "../components/Navbar";
import Breadcrumbs from "../components/Breadcrumbs";

export default function MainLayout() {
  return (
    <div className="flex">
      <Navbar />
      <main className="w-full overflow-auto p-2 md:p-5">
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
}

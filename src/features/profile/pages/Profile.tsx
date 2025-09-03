import Icons from "../../../components/Icons";
import ThemeControler from "../../../components/ThemeControler";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";

export default function Profile() {
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: <Icons variant="home" /> },
    { label: "Perfil", href: "/profile", icon: <Icons variant="profile" /> },
  ]);
  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-3xl font-black">Perfil</h2>
        <h3 className="text-xl label">edita tu cuenta y preferencias</h3>
      </div>
      <div className="divider"></div>
      <div className="flex items-center gap-5">
        <div className="avatar">
          <div className="w-32 rounded-full">
            <img
              title="avatar"
              src="https://img.daisyui.com/images/profile/demo/batperson@192.webp"
            />
          </div>
        </div>
        <div>
          <p className="label text-sm">Nombre</p>
          <input
            type="text"
            placeholder="daniel mosvich"
            className="input bg-base-content/5 rounded-field mt-1"
          />
          <div className="badge badge-success badge-soft mt-2 badge-sm">
            Administrador
          </div>
        </div>
      </div>
      <div className="mt-10 text-xl font-bold">Seguridad de la cuenta</div>
      <div className="divider my-2"></div>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <p className="">Correo electronico</p>
          <p className="text-base-content/50">daniel.mosvich@example.com</p>
        </div>
        <div>
          <button type="button" className="btn">
            Cambiar correo electronico
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <p className="">Contraseña</p>
          <p className="text-base-content/50">Establecer nueva contraseña</p>
        </div>
        <div>
          <button type="button" className="btn">
            Agregar nueva contraseña
          </button>
        </div>
      </div>

      <div className="mt-10 text-xl font-bold">Preferencias</div>
      <div className="divider my-2"></div>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <p className="">Apariencia</p>
          <p className="text-base-content/50">personaliza tu tema</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-1 bg-base-200 border p-1 rounded-md border-base-content/20">
            <div className="size-3 bg-base-content rounded-full"></div>
            <div className="size-3 bg-primary rounded-full"></div>
            <div className="size-3 bg-secondary rounded-full"></div>
            <div className="size-3 bg-accent rounded-full"></div>
          </div>
          <ThemeControler />
        </div>
      </div>

      <button
        type="button"
        className="btn fixed right-5 bottom-5 flex gap-3 btn-error btn-soft border border-error/20"
      >
        <Icons variant="logout" />
        Cerrar sesión
      </button>
    </div>
  );
}

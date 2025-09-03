import clsx from "clsx";
import { Link, NavLink } from "react-router";
import { useUiStore } from "../app/store/useUiStore";
import Icons from "./Icons";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

export default function Navbar() {
  const {
    isSidebarOpen: open,
    toggleIsSidebarOpen,
    setIsSidebarOpen,
  } = useUiStore();
  return (
    <>
      <button
        type="button"
        title="toggle sidebar"
        onClick={toggleIsSidebarOpen}
        className="bg-base-100 rounded-box border border-base-content/20 p-1 btn-accent fixed z-[41] top-2 left-[11px]  cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="2rem"
          height="2rem"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M2 12c0-3.69 0-5.534.814-6.841a4.8 4.8 0 0 1 1.105-1.243C5.08 3 6.72 3 10 3h4c3.28 0 4.919 0 6.081.916c.43.338.804.759 1.105 1.243C22 6.466 22 8.31 22 12s0 5.534-.814 6.841a4.8 4.8 0 0 1-1.105 1.243C18.92 21 17.28 21 14 21h-4c-3.28 0-4.919 0-6.081-.916a4.8 4.8 0 0 1-1.105-1.243C2 17.534 2 15.69 2 12m7.5-9v18M5 7h1m-1 3h1"
            color="currentColor"
          />
        </svg>
      </button>
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={clsx(
          "fixed bg-base-300/20 backdrop-blur-sm w-full h-full z-40",
          open ? "block md:hidden" : "hidden"
        )}
      ></div>
      <nav
        className={clsx(
          "z-40  min-h-screen h-screen overflow-hidden bg-base-200 shadow-lg transform transition-all duration-300 fixed md:relative border-r border-base-300 flex flex-col",
          open
            ? "w-60 min-w-60"
            : "w-16 min-w-16 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex-1">
          <h2
            className={clsx(
              "mt-14 p-3 pb-0 font-semibold opacity-0 transition-opacity",
              open && "opacity-100"
            )}
          >
            General
          </h2>
          <ul className="menu w-full">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  clsx("w-full px-3 py-2", isActive && "menu-active")
                }
              >
                <Icons variant="home" width="1.5rem" height="1.5rem" />
                <span className={clsx(open ? "block" : "hidden")}>Inicio</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/categories"
                className={({ isActive }) =>
                  clsx("w-full px-3 py-2", isActive && "menu-active")
                }
              >
                <Icons variant="category" width="1.5rem" height="1.5rem" />
                <span className={clsx(open ? "block" : "hidden")}>
                  Categorias
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  clsx("w-full px-3 py-2", isActive && "menu-active")
                }
              >
                <Icons variant="products" width="1.5rem" height="1.5rem" />
                <span className={clsx(open ? "block" : "hidden")}>
                  Productos
                </span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/inventory"
                className={({ isActive }) =>
                  clsx("w-full px-3 py-2", isActive && "menu-active")
                }
              >
                <Icons variant="inventory" width="1.5rem" height="1.5rem" />
                <span className={clsx(open ? "block" : "hidden")}>
                  Inventario
                </span>
              </NavLink>
            </li>
          </ul>
          <h2
            className={clsx(
              "p-3 pb-0 font-semibold opacity-0 transition-opacity",
              open && "opacity-100"
            )}
          >
            Perfil
          </h2>
          <ul className="menu w-full">
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  clsx("w-full px-3 py-2", isActive && "menu-active")
                }
              >
                <Icons variant="settings" width="1.5rem" height="1.5rem" />
                <span className={clsx(open ? "block" : "hidden")}>
                  Configuracion
                </span>
              </NavLink>
            </li>
            {/* <li>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                clsx("w-full px-3 py-2", isActive && "menu-active")
              }
            >
              <Icons variant="profile" width="1.5rem" height="1.5rem" />
              <span className={clsx(open ? "block" : "hidden")}>Perfil</span>
            </NavLink>
          </li>
          <li>
            <button
              type="button"
              className={clsx("w-full px-3 py-2 text-error")}
            >
              <Icons variant="logout" width="1.5rem" height="1.5rem" />
              <span className={clsx(open ? "block" : "hidden")}>
                Cerrar sesion
              </span>
            </button>
          </li> */}
          </ul>
        </div>

        {/* Avatar section at bottom */}
        <section className="p-2">
          <Link
            to={"/profile"}
            className={clsx(
              "flex  bg-base-100 border border-base-content/20 shadow items-center text-start rounded-box  overflow-hidden transition-all duration-300",
              open ? "justify-start p-2 gap-2" : "justify-center p-0 gap-0"
            )}
          >
            <div className="avatar flex-shrink-0">
              <div
                // className={clsx("mask mask-squircle", open ? "w-12" : "w-10")}
                className="w-12 rounded-box"
              >
                <img
                  src="https://img.daisyui.com/images/profile/demo/distracted1@192.webp"
                  alt="User avatar"
                />
              </div>
            </div>
            <div
              // style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}
              className={clsx(
                "transition-all duration-300 grid gap-3 grid-cols-[minmax(0,1fr)_auto] items-center w-full overflow-hidden",
                !open && "w-0"
              )}
            >
              <div>
                <h3 className="truncate text-sm font-semibold">
                  Jose Daniel Reyes Mosvich
                </h3>
                <div className="text-xs opacity-70 text-base-content truncate">
                  Administrador
                </div>
              </div>
              <Menu>
                <MenuButton
                  className={clsx("btn btn-circle btn-sm", !open && "w-0")}
                  onClick={(e) => e.preventDefault()}
                >
                  {({ active }) => (
                    <Icons
                      variant="right"
                      width="1.5rem"
                      height="1.5rem"
                      className={clsx(
                        "transition-transform ",
                        active && "-rotate-90"
                      )}
                    />
                  )}
                </MenuButton>
                <MenuItems
                  anchor="top end"
                  className={
                    "z-[41] bg-base-100 border border-base-content/20 p-1 rounded-selector -mt-6 ml-2"
                  }
                >
                  <MenuItem>
                    <button
                      type="button"
                      className="flex gap-2 items-center hover:bg-error/10 hover:text-error transition-colors p-2 rounded-field cursor-pointer"
                    >
                      <Icons variant="logout" />
                      Cerrar sesion
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      className="flex gap-2 transition-colors items-center hover:bg-base-content/10 p-2 rounded-field"
                      to="/profile"
                    >
                      <Icons variant="profile" />
                      Preferencias
                    </Link>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </Link>
        </section>
      </nav>
    </>
  );
}

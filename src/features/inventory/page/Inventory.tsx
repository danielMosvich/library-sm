import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import clsx from "clsx";
import { Link } from "react-router";
import { Fragment } from "react/jsx-runtime";
import InventoryTable from "./InventoryTable";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";
import Icons from "../../../components/Icons";

export default function Inventory() {
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: <Icons variant="home" /> },
    {
      label: "Inventario",
      href: "/inventory",
      icon: <Icons variant="inventory" />,
    },
  ]);
  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-3xl font-black">Inventario</h2>
        <h3 className="text-xl label">Gestion el inventario</h3>
      </div>
      {/* NAV */}
      <div className="bg-base-200 border border-base-content/20 shadow-xl flex flex-col-reverse md:flex-row p-4 gap-4 rounded-box">
        <fieldset className="fieldset w-full md:w-1/2">
          <label className="fieldset-label">Buscar producto</label>
          <div className="input w-full overflow-hidden fieldset-content pr-0">
            <input
              type="search"
              className=" w-full"
              placeholder="Buscar..."
              // value={searchTerm}
              // onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Menu>
              <MenuButton as={Fragment}>
                {({ active }) => (
                  <button
                    type="button"
                    className={
                      "h-full px-3 bg-base-200 border-0 border-l border-base-content/30 ml-auto flex items-center gap-2"
                    }
                  >
                    Buscar por{" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1.3rem"
                      height="1.3rem"
                      viewBox="0 0 24 24"
                      className={clsx(
                        "transition-transform",
                        active && "-rotate-180"
                      )}
                    >
                      <g fill="none" fillRule="evenodd">
                        <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                        <path
                          fill="currentColor"
                          d="M13.06 16.06a1.5 1.5 0 0 1-2.12 0l-5.658-5.656a1.5 1.5 0 1 1 2.122-2.121L12 12.879l4.596-4.596a1.5 1.5 0 0 1 2.122 2.12l-5.657 5.658Z"
                        />
                      </g>
                    </svg>
                  </button>
                )}
              </MenuButton>
              <MenuItems
                className={
                  "flex flex-col bg-base-200 shadow-xl border border-base-content/30 rounded-selector p-1 gap-1 mt-2"
                }
                anchor="bottom end"
              >
                <MenuItem>
                  <button
                    type="button"
                    className="hover:bg-base-100 border border-transparent cursor-pointer hover:border-base-content/20 px-2 py-1 rounded-field text-start"
                  >
                    Nombre
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    type="button"
                    className="hover:bg-base-100 border border-transparent cursor-pointer hover:border-base-content/20 px-2 py-1 rounded-field text-start"
                  >
                    Codigo
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    type="button"
                    className="hover:bg-base-100 border border-transparent cursor-pointer hover:border-base-content/20 px-2 py-1 rounded-field text-start"
                  >
                    Categoría
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </fieldset>
        <div className="flex w-full md:w-1/2 justify-start md:justify-end items-center">
          <Link
            to={"/inventory/add"}
            type="button"
            className="btn btn-primary btn-sm md:btn-md"
          >
            Agregar producto
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <InventoryTable />
    </div>
  );
}

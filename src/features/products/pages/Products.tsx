import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import React from "react";
import supabase from "../../../supabase/config";
import type { Tables } from "../../../../database.types";
import { useUiStore } from "../../../app/store/useUiStore";
import { Link } from "react-router";
import CategoryName from "../components/CategoryName";
import { clsx } from "clsx";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";

type ProductWithVariants = Tables<"products"> & {
  variants: Tables<"product_variants">[];
  variants_count: number;
};

async function fetchProductsPaginated({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}): Promise<{ data: ProductWithVariants[]; total: number }> {
  const { data, error, count } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)", { count: "exact" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;

  const processedData = data.map((product) => ({
    ...product,
    variants: product.variants || [],
    variants_count: product.variants ? product.variants.length : 0,
  }));

  return {
    data: processedData,
    total: count ?? 0,
  };
}

// Componente interno para mostrar variantes como tabla simulada
function ProductVariantsTable({
  variants,
  productName,
  productBrand,
}: {
  variants: Tables<"product_variants">[];
  productName: string;
  productBrand: string;
}) {
  if (variants.length === 0) {
    return (
      <tr>
        <td colSpan={8} className="text-center py-4 text-gray-500 italic">
          No hay variantes para este producto
        </td>
      </tr>
    );
  }

  return (
    <tr className="">
      <td colSpan={8} className="p-0">
        <div className="bg-base-50  border-b border-base-content/30">
          <table className="table table-sm w-full ">
            <thead>
              <tr className="">
                <th className="border-r border-base-content/50"></th>
                <th className="text-center">Imagen</th>
                <th>Nombre Variante</th>
                <th className="">Marca</th>
                <th className="text-center">SKU</th>
                <th className="text-center">Código</th>
                <th className="text-center">P. Compra</th>
                <th className="text-center">P. Venta</th>
                <th className="text-center">Unidad</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={variant.id} className="hover">
                  <td className="border-r border-base-content/50 relative">
                    <div className="btn btn-square btn-info btn-xs absolute top-1/3 -right-3 font-black">
                      {index + 1}
                    </div>
                  </td>

                  <td className="text-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white mx-auto">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          variant.image_url
                            ? variant.image_url
                            : "/images/no-image.webp"
                        }
                        alt={variant.variant_name}
                      />
                    </div>
                  </td>

                  <td>
                    <div className="text-sm">
                      <div className="font-medium">
                        {productName}{" "}
                        <span className="text-primary font-bold">
                          {variant.variant_name}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="text-base text-secondary font-semibold line-clamp-2">
                        {productBrand}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="kbd w-full">{variant.sku}</div>
                  </td>

                  <td>
                    <div className="kbd w-full">{variant.barcode || "N/A"}</div>
                  </td>

                  <td className="text-center">
                    <div className="text-sm font-bold text-success">
                      s/ {variant.cost_price.toFixed(2)}
                    </div>
                  </td>

                  <td className="text-center">
                    <div className="text-sm font-bold text-error">
                      s/ {variant.sale_price.toFixed(2)}
                    </div>
                  </td>

                  <td className="text-center">
                    <div className="kbd whitespace-nowrap">
                      {variant.exchange_rate} UN
                    </div>
                  </td>

                  <td className="text-center">
                    <div
                      className={clsx("badge font-black badge-sm", {
                        "badge-success": variant.active,
                        "badge-error": !variant.active,
                      })}
                    >
                      {variant.active ? "Activo" : "Inactivo"}
                    </div>
                  </td>

                  <td>
                    <div className="flex gap-1 justify-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-soft btn-warning"
                        title="Editar variante"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="0.8rem"
                          height="0.8rem"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-soft btn-error"
                        title="Eliminar variante"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="0.8rem"
                          height="0.8rem"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

export default function Products() {
  const productsPageSize = useUiStore((s) => s.productsPageSize);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", page, productsPageSize],
    queryFn: () => fetchProductsPaginated({ page, pageSize: productsPageSize }),
    placeholderData: (previousData) => previousData,
    enabled: page > 0 && productsPageSize > 0,
  });

  const tableData = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / productsPageSize);

  const toggleRowExpansion = (productId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const isRowExpanded = (productId: string) => expandedRows.has(productId);

  const goToPreviousPage = () => {
    setPage((currentPage) => Math.max(1, currentPage - 1));
  };

  const goToNextPage = () => {
    setPage((currentPage) => Math.min(totalPages, currentPage + 1));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="text-sm text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (isError) {
    console.error("Error al cargar productos:", error);
    return (
      <div className="alert alert-error">
        <div>
          <h3 className="font-bold">Error al cargar productos</h3>
          <div className="text-xs">
            {error?.message ||
              "Ocurrió un error inesperado. Intenta nuevamente."}
          </div>
        </div>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="2rem"
              height="2rem"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 15c4.875 0 7-2.051 7-7c0 4.949 2.11 7 7 7c-4.89 0-7 2.11-7 7c0-4.89-2.125-7-7-7ZM2 6.5c3.134 0 4.5-1.318 4.5-4.5c0 3.182 1.357 4.5 4.5 4.5c-3.143 0-4.5 1.357-4.5 4.5c0-3.143-1.366-4.5-4.5-4.5Z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No hay productos</h3>
          <p className="text-gray-600">
            No se encontraron productos para mostrar.
          </p>
          <Link to={"/products/add"}>
            <button type="button" className="btn btn-sm mt-4 btn-info">
              Agregar el primer producto
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-3xl font-black">Gestion de Productos</h2>
        <h3 className="text-xl label">administra toda la lista de productos</h3>
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
            to={"/products/add"}
            type="button"
            className="btn btn-primary btn-sm md:btn-md"
          >
            Agregar producto
          </Link>
        </div>
      </div>
      {/* table */}
      <div className="overflow-x-auto rounded-box border border-base-content/30 bg-base-100">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200 border-base-content/30">
              <th className="w-12"></th>
              <th className="w-16">Imagen</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Tags / Info</th>
              <th className="text-center">Variantes</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((product) => (
              <React.Fragment key={product.id}>
                <tr
                  className={clsx(
                    "hover font-medium border-base-content/30",
                    isRowExpanded(product.id) && "bg-info/10"
                  )}
                >
                  <td className="relative min-w-14">
                    <div
                      onClick={() => toggleRowExpansion(product.id)}
                      className={clsx(
                        "bg-base-200  w-full h-full absolute top-0 left-0 flex items-center justify-center",
                        {
                          "bg-info text-base-300": isRowExpanded(product.id),
                        }
                      )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="2rem"
                        height="2rem"
                        viewBox="0 0 24 24"
                        className={`transition-transform duration-200 ${
                          isRowExpanded(product.id) ? "rotate-90" : ""
                        }`}
                      >
                        <path
                          fill="currentColor"
                          d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.42Z"
                        />
                      </svg>
                    </div>
                    {/* <button
                      type="button"
                      className={clsx(
                        "btn btn-square border-base-content/30 btn-sm md:btn-md",
                        {
                          "btn-info": isRowExpanded(product.id),
                        }
                      )}
                      onClick={() => toggleRowExpansion(product.id)}
                      title={`${
                        isRowExpanded(product.id) ? "Contraer" : "Expandir"
                      } variantes`}
                    >
                      
                    </button> */}
                  </td>
                  <td>
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          product.image_url
                            ? product.image_url
                            : "/images/no-image.webp"
                        }
                        alt={product.name}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="font-bold first-letter:uppercase line-clamp-1 overflow-ellipsis w-fit">
                      {product.name}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium">{product.brand}</div>
                  </td>
                  <td>
                    <CategoryName categoryId={product.category_id} />
                  </td>
                  <td>
                    {product.tags && product.tags.length > 0 ? (
                      <div>
                        <Popover className={"group"}>
                          <PopoverButton
                            className={"btn btn-sm whitespace-nowrap"}
                          >
                            Ver Tags{" "}
                            <div className="group-data-open:rotate-180 transition">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1rem"
                                height="1rem"
                                viewBox="0 0 24 24"
                              >
                                <g fill="none" fillRule="evenodd">
                                  <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                                  <path
                                    fill="currentColor"
                                    d="M13.06 16.06a1.5 1.5 0 0 1-2.12 0l-5.658-5.656a1.5 1.5 0 1 1 2.122-2.121L12 12.879l4.596-4.596a1.5 1.5 0 0 1 2.122 2.12l-5.657 5.658Z"
                                  />
                                </g>
                              </svg>
                            </div>
                          </PopoverButton>
                          <PopoverPanel
                            transition
                            anchor="bottom"
                            className="divide-y  rounded-xl bg-base-200 text-sm/6 transition duration-200 ease-in-out [--anchor-gap:--spacing(2)] data-closed:-translate-y-1 data-closed:opacity-0 border border-base-content/5 shadow-xl"
                          >
                            <div className="p-2 flex flex-col cursor-pointer">
                              {product.tags.map((tag, index) => (
                                <div
                                  key={`tag-${index}`}
                                  className="hover:bg-base-100 p-1 px-2 border border-transparent hover:border-base-content/10 rounded-selector "
                                >
                                  {tag}
                                </div>
                              ))}
                            </div>
                          </PopoverPanel>
                        </Popover>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin tags</span>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="badge badge-info badge-soft font-bold whitespace-nowrap">
                      {product.variants_count || 0} Variantes
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-soft btn-warning"
                        title="Editar producto"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1rem"
                          height="1rem"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-soft btn-error"
                        title="Eliminar producto"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1rem"
                          height="1rem"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Variantes expandidas */}
                {isRowExpanded(product.id) && (
                  <ProductVariantsTable
                    variants={product.variants}
                    productName={product.name}
                    productBrand={product.brand}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
        <div className="text-sm text-gray-600">
          Página {page} de {totalPages}
        </div>
        <div className="join">
          <button
            type="button"
            className="btn join-item"
            onClick={goToPreviousPage}
            disabled={page === 1}
            aria-label="Ir a la página anterior"
          >
            ←
          </button>
          <button type="button" className="btn join-item">
            {page}
          </button>
          <button
            type="button"
            className="btn join-item"
            onClick={goToNextPage}
            disabled={page === totalPages}
            aria-label="Ir a la página siguiente"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

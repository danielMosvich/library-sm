import { useEffect } from "react";
import type { Tables } from "../../../../../database.types";
import Icons from "../../../../components/Icons";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import clsx from "clsx";

type ProductWithVariants = Tables<"products"> & {
  variants: (Tables<"product_variants"> & {
    color: { name: string; hex_code: string };
  })[];
  variants_count: number;
  category: { name: string | null };
};
export default function ProductTable({
  data,
}: {
  data: {
    data: ProductWithVariants[];
    total: number;
  };
}) {
  useEffect(() => {
    console.log(data);
  }, [data]);
  return (
    <div className="grid lg:grid-cols-1 gap-4">
      {data.total > 0 &&
        data.data.map((product, index) => {
          return (
            <Disclosure key={product.id}>
              {({ open }) => (
                <>
                  <div className="flex flex-col border-4 border-base-100 ring-2 ring-base-300 rounded-box">
                    <div
                      key={product.id}
                      className={clsx(
                        "flex gap-2 md:gap-5 p-2 md:p-5 pb-6 md:pb-6 pt-0 md:pt-0 bg-base-300 rounded-box  relative h-full",
                        open && "rounded-b-none"
                      )}
                    >
                      <div className="w-fit relative">
                        <div className="overflow-hidden w-16 h-full md:w-40 md:h-52 rounded-b-xl bg-base-100">
                          <img
                            className="w-full h-full object-cover"
                            src={product.image_url ? product.image_url : ""}
                            alt={product.name}
                          />
                        </div>
                      </div>
                      <div className="flex bg-gradient-to-r from-base-100 to-base-200 mt-2 md:mt-5 gap-2 p-3 pb-6  w-full rounded-box">
                        <div className="w-full">
                          <h3 className="text-base md:text-xl  font-bold first-letter:uppercase line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-base md:text-lg font-semibold text-secondary first-letter:uppercase">
                            {product.brand}
                          </p>
                          <p className="text-sm text-base-content/50">
                            {product.category.name}
                          </p>
                          {/* buttons */}
                          <div className="flex gap-2 absolute md:bottom-1 bottom-2.5">
                            <DisclosureButton>
                              <button
                                type="button"
                                className={clsx(
                                  "bg-base-300 w-fit px-4 py-1 rounded-full ring-4 border-2 truncate border-base-content/30 ring-base-300 font-bold flex items-center gap-2 text-sm md:text-base transition-colors",
                                  open && "ring-success border-success"
                                )}
                              >
                                Ver
                                <Icons
                                  variant="down"
                                  className="animate-pulse"
                                />
                              </button>
                            </DisclosureButton>
                            {product.variants_count > 1 && (
                              <button
                                type="button"
                                title={`${product.variants_count} variantes`}
                                className="btn btn-success w-fit px-3 font-black text-lg btn-circle border-base-300 border-4 shadow-none btn-sm md:btn-md"
                              >
                                {product.variants_count}
                              </button>
                            )}
                            <button
                              type="button"
                              title="descripcion"
                              className="btn btn-circle btn-soft border-base-300 border-4 shadow-none btn-sm md:btn-md"
                              //   disabled={product.description ? false : true}
                            >
                              <Icons variant="document" />
                            </button>
                            <button
                              type="button"
                              title="tags"
                              className="btn btn-info btn-soft btn-circle border-base-300 border-4 shadow-none btn-sm md:btn-md"
                              disabled={product.tags ? false : true}
                            >
                              <Icons variant="tags" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-center relative">
                          <div className="flex flex-col-reverse md:flex-row gap-2">
                            <button
                              type="button"
                              title="Editar"
                              className="transition-all btn btn-warning rounded-xl btn-soft active:scale-95 hover:scale-105 border-4 ring-2 border-base-100 ring-base-300 hover:ring-warning shadow-lg btn-sm xl:btn-md"
                            >
                              <Icons variant="edit" />
                            </button>
                            <button
                              type="button"
                              title="Eliminar"
                              className="transition-all btn btn-error rounded-xl btn-soft active:scale-95 hover:scale-105 border-4 ring-2 border-base-100 ring-base-300 hover:ring-error shadow-lg btn-sm xl:btn-md"
                            >
                              <Icons variant="trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VARIANTS */}
                    {/* <div className="flex flex-col gap-6 p-5 bg-base-300 pb-7 h-3 max-h-3 overflow-clip"></div> */}
                    {/* <div className="h-fit overflow-clip"> */}
                    {/* <Disclosure></Disclosure> */}
                    <DisclosurePanel
                      transition
                      className={
                        "origin-top transition duration-200 ease-out data-closed:-translate-y-6 data-closed:opacity-0 flex flex-col p-5 bg-base-300 pb-10 gap-8 rounded-b-box"
                      }
                    >
                      {product.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center relative bg-neutral/30 p-2 rounded-selector ring-2 ring-neutral/40"
                        >
                          {/* {variant.active} - {variant.sku} */}
                          <div className="absolute -top-3 -left-3">
                            <div className="bg-neutral/30 rounded-full p-1 text-base-content/30">
                              <Icons
                                variant="settings"
                                width="1rem"
                                height="1rem"
                              />
                            </div>
                          </div>
                          {/* content */}
                          <div className="bg-rose-500 overflow-hidden rounded-lg w-20 h-20 min-w-20 min-h-20">
                            <img
                              className="w-full h-full object-cover rounded-lg"
                              src={
                                variant.image_url
                                  ? variant.image_url
                                  : "/images/no-image.webp"
                              }
                              alt=""
                            />
                          </div>
                          <div className="p-4 pt-0 h-full w-full relative">
                            <div>
                              <h4 className="font-semibold first-letter:uppercase line-clamp-2">
                                {`${product.name} `}
                                <b className="text-info">{`${product.brand} `}</b>
                                {variant.unit}
                                <b className="text-primary">
                                  {` (${variant.exchange_rate} und)`}
                                </b>
                              </h4>
                              <div className="flex gap-2">
                                <div className="font-semibold text-base-content/30">
                                  <span className="font-semibold"></span>{" "}
                                  {variant.sku}
                                </div>
                                {variant.barcode && (
                                  <div className="font-semibold text-base-content/30">
                                    <span className="font-semibold"></span>{" "}
                                    {variant.barcode}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -bottom-6 flex gap-4">
                              {/* <button
                                type="button"
                                title="some"
                                className="btn rounded-full ring-4 ring-base-300 h-[32px] shadow-none  btn-success font-black"
                              >
                                {variant.sale_price.toFixed(2)}
                              </button>
                              <button
                                type="button"
                                title="some"
                                className="btn rounded-full ring-4 ring-base-300 h-[32px] shadow-none  btn-warning font-black"
                              >
                                {variant.cost_price.toFixed(2)}
                              </button> */}
                              {variant.color && (
                                <div
                                  className="rounded-full shadow-none h-fit font-black flex
                          ring-2 ring-base-100 items-center
                          "
                                >
                                  {
                                    <div className="font-semibold bg-base-200 px-2 h-[32px] rounded-l-full z-10 relative flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="1.5rem"
                                        height="1.5rem"
                                        viewBox="0 0 769 690"
                                        className="drop-shadow-sm drop-shadow-black"
                                      >
                                        <path
                                          fill="currentColor"
                                          d="M767.074 148c15-50-112-130-227-135c-223-9-515 108-539 365c-18 206 194 312 350 312c157 0 306-121 322-187c16-68-143-49-132-157c16-153 204-125 226-198m-236-35c0 26-20 46-45 46c-26 0-46-20-46-46c0-25 20-45 46-45c25 0 45 20 45 45m-124 24c0 28-22 50-49 50s-49-22-49-50c0-26 22-48 49-48s49 22 49 48m-119 65c0 29-22 52-51 52c-28 0-51-23-51-52c0-27 23-49 51-49c29 0 51 22 51 49m-100 114c0 29-24 53-53 53c-31 0-55-24-55-53c0-31 24-55 55-55c29 0 53 24 53 55m275 192c0 38-32 69-71 69c-38 0-69-31-69-69c0-39 31-72 69-72c39 0 71 33 71 72"
                                        />
                                      </svg>
                                      <div
                                        style={{
                                          width: 0,
                                          height: 0,
                                          borderTop: "16px solid transparent",
                                          // borderLeft: "16px solid transparent",
                                          borderBottom:
                                            "16px solid transparent",
                                        }}
                                        className="absolute top-0 -right-[8.3px] border-l-[9px] border-l-base-200"
                                      ></div>
                                    </div>
                                  }
                                  <div
                                    className="h-[32px] flex items-center px-2 rounded-r-full  pl-4"
                                    style={{
                                      backgroundColor: variant.color.hex_code,
                                      textShadow: "0 2px 3px black",
                                    }}
                                  >
                                    {/* TOMAR LAS 3 LETREAS DE un COLOR Y SI TIENEs MAS DE DOS PALABRAS TOMAR LAS 3 DE AMBAS */}
                                    {variant.color.name.length > 3
                                      ? variant.color.name
                                          .split(" ")
                                          .map((word) => word.slice(0, 3))
                                          .join(" ")
                                          .toUpperCase()
                                      : variant.color.name.toUpperCase()}
                                    ..
                                    {/* {variant.color.name.split("")[0]} */}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </DisclosurePanel>
                    {/* </div> */}
                  </div>
                </>
              )}
            </Disclosure>
          );
        })}
    </div>
  );
}

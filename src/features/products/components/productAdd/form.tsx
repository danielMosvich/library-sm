import { useForm, type SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select } from "@headlessui/react";
// import { useNavigate } from "react-router";
import supabase from "../../../../supabase/config";
import CategoryGenerator from "../../../../components/ai/CategoryGenerator";
import TagsGenerator from "../../../../components/ai/TagsGenerator";
// import { toast } from "sonner";
// import type { ProductFormData } from "../../../../types/productAdd";
import { useProductStore } from "../../../../app/store/product/useProductStore";
import ModalVariant from "./modalVariant";
import Icons from "../../../../components/Icons";
// Tipos para el modal de variantes
// interface ProductAddFormProps {
//   onSubmit?: (data: ProductFormData) => void;
// }
interface IFormInput {
  name: string;
  brand: string;
  category_id: string;
  description: string;
  image_url: string;
  tags: string;
}
export default function ProductAddForm() {
  const [colors, setColors] = useState<
    | null
    | {
        id: number;
        name: string;
        hex_code: string | null;
        alt_names: string[] | null;
        order_index: number | null;
        category: string;
        active: boolean;
      }[]
  >(null);
  // React Hook Form setup
  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<IFormInput>({
    defaultValues: {
      name: "",
      brand: "generica",
      category_id: "",
      description: "",
      image_url: "/images/no-image.webp",
      tags: "",
    },
  });
  const watchedName = watch("name");
  const watchedBrand = watch("brand");
  const watchedCategoryId = watch("category_id");
  // ?ZUSTAND STORE
  const {
    variants,
    aiOptionsEnabled,
    defaultPricesEnabled,
    removeVariant,
    changeModalMode,
    setCurrentEditVariant,
    modalMode,
  } = useProductStore();

  //*!Estados locales
  const [defaultPrices, setDefaultPrices] = useState({
    cost_price: 0,
    sale_price: 0,
  });
  //* Querys
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  async function getColors() {
    const { data, error } = await supabase
      .from("colors")
      .select("*")
      .eq("active", true)
      .order("order_index", { ascending: true });
    if (error) throw error;
    setColors(data || []);
    // console.log(data);
  }
  useEffect(() => {
    getColors();
  }, []);

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log(data);
  };
  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-4"
      >
        {/* INFORMACIÓN DEL PRODUCTO */}
        <fieldset className="fieldset bg-base-300 rounded-box p-2 md:p-4">
          <legend className="fieldset-legend">Información del Producto</legend>
          {/* IMAGEN */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">URL de Imagen Principal</label>
              <input
                title="URL de imagen del producto"
                type="text"
                className="input w-full"
                placeholder="https://ejemplo.com/imagen.jpg"
                {...register("image_url")}
                onFocus={(e) => e.target.select()}
              />
            </fieldset>
            <div className="flex skeleton w-full max-h-40 min-h-52 overflow-hidden rounded-box shadow-lg">
              {watch("image_url") !== "" && (
                <img
                  className="w-full h-full  object-cover"
                  src={watch("image_url")}
                  alt="image"
                />
              )}
            </div>
          </div>
          {/* NOMBRE - MARCA */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Nombre</label>
              <div className="relative">
                <input
                  title="Nombre del producto"
                  type="text"
                  className={`input w-full ${errors.name ? "input-error" : ""}`}
                  {...register("name", { required: true })}
                  onFocus={(e) => e.target.select()}
                />

                {errors.name?.type === "required" && (
                  <p role="alert" className="text-error font-semibold mt-2 ">
                    El nombre es requerido
                  </p>
                )}
              </div>
            </fieldset>

            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Marca</label>
              <input
                title="Marca del producto"
                type="text"
                className={`input w-full ${errors.brand ? "input-error" : ""}`}
                {...register("brand", { required: true })}
                onFocus={(e) => {
                  e.target.select();
                }}
                onBlur={(e) => {
                  if (e.target.value.trim() === "") {
                    setValue("brand", "Generica");
                  }
                }}
              />
              {errors.brand?.type === "required" && (
                <p role="alert" className="text-error font-semibold mt-2 ">
                  {errors.brand.message}
                </p>
              )}
            </fieldset>
          </div>
          {/* CATEGORIA - DESCRIPCION */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Categoría</label>
              <div className="flex gap-2">
                <Select
                  className="input w-full"
                  {...register("category_id")}
                  disabled={loadingCategories}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>

                {aiOptionsEnabled && (
                  <CategoryGenerator
                    product={{ name: watchedName, brand: watchedBrand }}
                    onSelected={(categoryId) =>
                      setValue("category_id", categoryId)
                    }
                    disabled={
                      !aiOptionsEnabled || !watchedName || !watchedBrand
                    }
                  />
                )}
              </div>
            </fieldset>

            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Descripción</label>
              <input
                title="Descripción del producto"
                type="text"
                className="input w-full"
                {...register("description")}
              />
            </fieldset>
          </div>
          {/* TAGS */}
          <div className="grid grid-cols-1 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">
                Tags (separados por coma)
              </label>
              <div className="flex gap-2">
                <input
                  title="Tags del producto"
                  type="text"
                  className="input w-full flex-1"
                  placeholder="tag1, tag2, tag3"
                  {...register("tags")}
                />
                {aiOptionsEnabled && watchedCategoryId && (
                  <TagsGenerator
                    name={watchedName}
                    categoryId={watchedCategoryId}
                    onSelected={(tags) => setValue("tags", tags.join(", "))}
                    disabled={
                      !aiOptionsEnabled || !watchedName || !watchedBrand
                    }
                  />
                )}
              </div>
            </fieldset>
          </div>

          {/* Precios por defecto */}
          {defaultPricesEnabled && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <label className="fieldset-label">
                  Precio de Costo por Defecto
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input w-full"
                  value={defaultPrices.cost_price}
                  onChange={(e) => {
                    setDefaultPrices({
                      ...defaultPrices,
                      cost_price: Number(e.target.value),
                    });
                  }}
                  placeholder="0.00"
                  onFocus={(e) => e.target.select()}
                />
              </fieldset>
              <fieldset className="fieldset">
                <label className="fieldset-label">
                  Precio de Venta por Defecto
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input w-full"
                  value={defaultPrices.sale_price}
                  onChange={(e) => {
                    setDefaultPrices({
                      ...defaultPrices,
                      sale_price: Number(e.target.value),
                    });
                  }}
                  placeholder="0.00"
                  onFocus={(e) => e.target.select()}
                />
              </fieldset>
            </div>
          )}
        </fieldset>

        {/* VARIANTES */}
        <fieldset className="fieldset bg-base-200 rounded-box p-2 md:p-4 flex">
          <legend className="fieldset-legend">Gestión de Variantes</legend>
          {variants.length > 0 ? (
            <div className="w-full">
              <button
                onClick={() => {
                  changeModalMode("create");
                  setCurrentEditVariant(null);
                  (
                    document.getElementById(
                      "add_variant_modal"
                    ) as HTMLDialogElement
                  )?.showModal();
                }}
                type="button"
                className="btn btn-md btn-success font-bold"
                disabled={!isValid}
              >
                Agregar Variante <Icons variant="add" />
              </button>
              <div className="grid sm:grid-cols-2 gap-4 lg:grid-cols-1">
                {variants.map((item, index) => {
                  return (
                    <div
                      className="grid lg:grid-cols-[150px_1fr_auto] lg:gap-4 items-center bg-base-300 border border-base-content/20 rounded-box mt-3 relative"
                      key={"variant-" + index}
                    >
                      <div className="w-full h-[150px] overflow-hidden rounded-selector shadow-xl">
                        <img
                          className="w-full h-full object-cover"
                          src={
                            item.image_url
                              ? item.image_url
                              : "/images/no-image.webp"
                          }
                          alt=""
                        />
                      </div>
                      <div className="p-4 lg:p-0 flex items-center pr-4 justify-between w-full overflow-x-hidden">
                        <div className="min-w-0">
                          <div className="relative text-sm flex flex-col gap-1 py-2">
                            <h4 className="font-bold first-letter:uppercase truncate">
                              {watchedName}
                            </h4>
                            <h5 className="capitalize truncate">
                              {watchedBrand}
                            </h5>
                            <div className="flex gap-2 flex-wrap">
                              <span className="badge badge-info font-bold truncate">
                                {item.unit}
                              </span>
                              <span className="badge badge-info badge-soft font-bold truncate">
                                {item.exchange_rate} UND
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {colors && item.color_id && (
                            <div className="flex flex-col items-center gap-2 font-semibold">
                              <div
                                className="tooltip tooltip-left"
                                data-tip={colors[item.color_id - 1]?.name}
                              >
                                <div
                                  style={{
                                    backgroundColor:
                                      colors[item.color_id - 1]?.hex_code ||
                                      "#ffffff",
                                  }}
                                  className="w-8 h-8 border border-base-content/30 rounded-full"
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col px-4 pb-4 lg:p-4">
                        <div className="badge badge-soft block badge-warning font-bold mt-1">
                          Compra: s/ {item.cost_price.toFixed(2)}
                        </div>
                        <div className="badge badge-soft block badge-success font-bold mt-1">
                          Venta: s/ {item.sale_price.toFixed(2)}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          title="Editar Variante"
                          type="button"
                          className="btn btn-xs btn-square btn-warning"
                          onClick={() => {
                            changeModalMode("edit");
                            setCurrentEditVariant(item);
                            (
                              document.getElementById(
                                "add_variant_modal"
                              ) as HTMLDialogElement
                            )?.showModal();
                          }}
                        >
                          <Icons variant="edit" width="1rem" height="1rem" />
                        </button>
                        <button
                          title="Eliminar Variante"
                          type="button"
                          className="btn btn-xs btn-square btn-error"
                          onClick={() => {
                            // Handle delete variant
                            removeVariant(item.idx);
                          }}
                        >
                          <Icons variant="close" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <button
                type="button"
                className="btn btn-success mb-5"
                onClick={() => {
                  changeModalMode("create");
                  setCurrentEditVariant(null);
                  (
                    document.getElementById(
                      "add_variant_modal"
                    ) as HTMLDialogElement
                  )?.showModal();
                }}
                disabled={!isValid}
              >
                Agregar Variante <Icons variant="add" />
              </button>
            </div>
          )}
        </fieldset>

        {/* BOTONES DE ACCIÓN */}
        <div className="max-w-4xl bg-base-100 rounded-box p-2 shadow-xl mx-auto mt-6 absolute bottom-5 right-5">
          <button
            type="submit"
            className="btn btn-primary"
            // disabled={checkingProductName || isSubmitting}
          >
            Crear Producto
          </button>
          <button type="button" className="btn btn-outline ml-2">
            Cancelar
          </button>
        </div>

        {/* MODAL PARA AGREGAR/EDITAR VARIANTES */}
      </form>
      {modalMode}
      <ModalVariant
        defaultImage={watch("image_url")}
        defaultPrices={defaultPrices}
      />
    </>
  );
}

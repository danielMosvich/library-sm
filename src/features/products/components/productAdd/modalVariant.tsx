import { useForm } from "react-hook-form";
import ColorCombobox from "../../../../components/Combobox";
import { useQuery } from "@tanstack/react-query";
import supabase from "../../../../supabase/config";
import { useProductStore } from "../../../../app/store/product/useProductStore";
import { CreateVariant } from "../../../../models/products/CreateProduct";
import { toast } from "sonner";
import clsx from "clsx";
// import { useEffect } from "react";
interface IFormInput {
  unit: string;
  exchange_rate: number;
  color_id: number | null;
  sku: string;
  barcode: string;
  cost_price: number;
  sale_price: number | null;
  image_url: string;
  hasInventory: boolean;
  inventoryStock: number;
  inventoryMinStock: number;
  inventoryLocationId: string | null;
  inventorySection: string | null;
}
export default function ModalVariant() {
  const { addVariant, variants } = useProductStore();
  const formVariants = useForm<IFormInput>({
    defaultValues: {
      unit: "unidad",
      exchange_rate: 1,
      color_id: null as number | null,
      sku: "",
      barcode: "",
      cost_price: 0,
      sale_price: null,
      image_url: "/images/no-image.webp",

      hasInventory: false,
      inventoryStock: 1,
      inventoryMinStock: 1,
      inventoryLocationId: "",
      inventorySection: "",
    },
  });
  const {
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = formVariants;

  const {
    data: locations,
    isLoading,
    // error,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const onSubmit = handleSubmit((data) => {
    const { ok, variant } = CreateVariant({
      idx: variants.length,
      image_url: data.image_url || null,
      unit: data.unit,
      exchange_rate: data.exchange_rate,
      color_id: data.color_id || null,
      barcode: data.barcode || null,
      cost_price: data.cost_price,
      sale_price: data.sale_price || 0,

      hasInventory: data.hasInventory,
      stock: data.inventoryStock,
      min_stock: data.inventoryMinStock || 0,
      location_id: data.inventoryLocationId || null,
      section: data.inventorySection || null,
    });
    if (ok) {
      addVariant(variant);
      reset();
      toast.success("Variante agregada");
      HTMLDialogElement.prototype.close.call(
        document.getElementById("add_variant_modal") as HTMLDialogElement
      );
    } else {
      toast.error("Error al agregar variante: " + variant);
    }
  });
  return (
    <dialog
      id="add_variant_modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <form
        onSubmit={onSubmit}
        className="modal-box max-w-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg mb-4">Agregar Nueva Variante</h3>

        <div className="flex flex-col gap-2 md:gap-4">
          {/* IMG */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">
                URL de Imagen de Variante
              </label>
              <input
                type="search"
                className="input w-full"
                {...register("image_url")}
                onBlur={(e) => {
                  if (e.target.value.trim() === "") {
                    setValue("image_url", "/images/no-image.webp");
                  }
                }}
                onFocus={(e) => {
                  e.target.select();
                }}
              />
            </fieldset>
            <div className="flex skeleton w-full max-h-40 min-h-40 overflow-hidden rounded-box">
              {watch("image_url") !== "" && (
                <img
                  className="w-full h-full  object-cover"
                  src={watch("image_url")}
                  alt="image"
                />
              )}
            </div>
          </div>
          {/* UNIDAD - EXCHANGE */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Unidad</label>
              <input
                type="text"
                className="input w-full"
                placeholder="unidad, caja, paquete, x12, etc."
                {...register("unit", { required: true })}
                onFocus={(e) => {
                  e.target.select();
                }}
              />
            </fieldset>
            <div className="grid grid-cols-1 gap-2">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Conversión a Unidad</label>
                <div className="input w-full pr-2">
                  <input
                    type="number"
                    className="w-full text-center font-black"
                    min="1"
                    step="1"
                    {...register("exchange_rate", {
                      required: true,
                      valueAsNumber: true,
                    })}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                  />
                  <span className="kbd px-4">UNIDAD</span>
                </div>
              </fieldset>
            </div>
          </div>
          {/* COLOR - BARCODE */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Color (opcional)</label>
              <ColorCombobox
                value={watch("color_id")}
                onColorSelect={(color) =>
                  setValue("color_id", color?.id || null)
                }
              />
            </fieldset>
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Código de Barras</label>
              <input
                type="text"
                className="input w-full"
                placeholder="0000000"
                {...register("barcode")}
              />
            </fieldset>
          </div>
          {/* Precios*/}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Precio de Costo</label>
              <input
                type="number"
                className="input w-full"
                min="0"
                step="0.01"
                placeholder="0"
                {...register("cost_price", {
                  valueAsNumber: true,
                  required: true,
                })}
                onFocus={(e) => {
                  e.target.select();
                }}
              />
            </fieldset>

            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Precio de Venta</label>
              <input
                type="number"
                className={clsx(
                  "input w-full",
                  errors.sale_price && "input-error"
                )}
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register("sale_price", {
                  required: true,
                  valueAsNumber: true,
                })}
                onFocus={(e) => {
                  e.target.select();
                }}
              />
              {errors.sale_price && (
                <p className="text-red-500">El precio de venta es requerido</p>
              )}
            </fieldset>
          </div>

          {/* SECCIÓN DE INVENTARIO */}
          <div className="divider">Inventario</div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                Crear inventario para esta variante
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                {...register("hasInventory")}
              />
            </label>
          </div>

          {watch("hasInventory") && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">Stock Inicial</label>
                  <input
                    type="number"
                    className="input w-full"
                    min="1"
                    step="1"
                    placeholder="0"
                    {...register("inventoryStock", { valueAsNumber: true })}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">Stock Mínimo</label>
                  <input
                    type="number"
                    className="input w-full"
                    min="1"
                    step="1"
                    placeholder="0"
                    {...register("inventoryMinStock", { valueAsNumber: true })}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                  />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 gap-2 md:gap-4">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">Ubicación</label>
                  {locations && (
                    <select
                      className="select select-bordered w-full"
                      {...register("inventoryLocationId")}
                    >
                      <option value="">Seleccionar ubicación</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {isLoading && (
                    <div className="text-xs text-gray-500 mt-1">
                      Cargando ubicaciones...
                    </div>
                  )}
                </fieldset>
              </div>

              <div className="grid grid-cols-1 gap-2 md:gap-4">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">Sección (Opcional)</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Ej: Estante A, Pasillo 3, etc."
                    {...register("inventorySection")}
                    // onChange={(e) =>
                    //   handleNewVariantChange(
                    //     "inventorySection",
                    //     e.target.value
                    //   )
                    // }
                  />
                </fieldset>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-error btn-outline"
            onClick={() => {
              (
                document.getElementById(
                  "add_variant_modal"
                ) as HTMLDialogElement
              ).close();
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            // onClick={addNewVariant}
          >
            Agregar variante
          </button>
        </div>
      </form>
    </dialog>
  );
}

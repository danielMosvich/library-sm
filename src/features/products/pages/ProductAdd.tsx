import supabase from "../../../supabase/config";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { TablesInsert } from "../../../../database.types"; // Ajusta la ruta según tu estructura
import { Select } from "@headlessui/react";

// Tipos para el formulario
interface ProductFormData {
  name: string;
  brand: string;
  category_id?: string;
  description?: string;
  image_url?: string;
  tags: string;
  slug: string;
  variants: VariantFormData[];
}

interface VariantFormData {
  variant_name: string;
  barcode?: string;
  sale_price: number;
  cost_price: number;
  image_url?: string;
  exchange_rate: number;
  sku: string;
  currency: string;
}

interface NewVariantData {
  variant_name: string;
  barcode?: string;
  sale_price: string;
  cost_price: string;
  image_url?: string;
  exchange_rate: number;
  currency: string;
  sku: string;
}

export default function ProductAdd() {
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [newVariant, setNewVariant] = useState<NewVariantData>({
    variant_name: "",
    barcode: "",
    sale_price: "",
    cost_price: "",
    image_url: "",
    exchange_rate: 1,
    currency: "PEN",
    sku: "",
  });

  // Estado para categorías
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      brand: "",
      category_id: "",
      description: "",
      image_url: "",
      tags: "",
      slug: "",
      variants: [
        {
          variant_name: "unidad",
          barcode: "",
          sale_price: 0,
          cost_price: 0,
          image_url: "",
          exchange_rate: 1,
          sku: "",
          currency: "PEN",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const watchName = watch("name");
  const watchVariants = watch("variants");

  // Generar SKU automáticamente
  const generateSKU = (
    productName: string,
    variantName: string,
    index: number
  ): string => {
    if (!productName) return "";

    const productInitials = productName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 3);

    const variantInitial = variantName
      ? variantName.charAt(0).toUpperCase()
      : "U";
    const timestamp = Date.now().toString().slice(-4);

    return `${productInitials}${variantInitial}${String(index + 1).padStart(
      2,
      "0"
    )}${timestamp}`;
  };

  // Generar slug automáticamente
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Actualizar SKUs y slug cuando cambia el nombre del producto
  useEffect(() => {
    if (watchName) {
      setValue("slug", generateSlug(watchName));
      watchVariants.forEach((variant, index) => {
        const newSKU = generateSKU(watchName, variant.variant_name, index);
        setValue(`variants.${index}.sku`, newSKU);
      });
    }
  }, [watchName, setValue, watchVariants]);

  // Actualizar SKU cuando cambia el nombre de una variante
  useEffect(() => {
    if (watchName) {
      watchVariants.forEach((variant, index) => {
        const newSKU = generateSKU(watchName, variant.variant_name, index);
        setValue(`variants.${index}.sku`, newSKU);
      });
    }
  }, [watchName, setValue, watchVariants]);

  // Asegurarse de que los valores de las variantes se actualicen correctamente
  useEffect(() => {
    const updatedVariants = watchVariants.map((variant, index) => {
      const newVariantName = variant.variant_name || `Variante ${index + 1}`;
      if (variant.variant_name !== newVariantName) {
        return { ...variant, variant_name: newVariantName };
      }
      return variant;
    });

    if (JSON.stringify(watchVariants) !== JSON.stringify(updatedVariants)) {
      setValue("variants", updatedVariants, { shouldDirty: false });
    }
  }, [watchVariants, setValue]);

  // Toggle de variantes
  const handleVariantToggle = (hasVariantsValue: boolean): void => {
    setHasVariants(hasVariantsValue);

    if (!hasVariantsValue) {
      // Si no tiene variantes, resetear a una sola con nombre "unidad"
      setValue("variants", [
        {
          variant_name: "unidad",
          barcode: "",
          sale_price: 0,
          cost_price: 0,
          image_url: "",
          exchange_rate: 1,
          sku: watchName ? generateSKU(watchName, "unidad", 0) : "",
          currency: "PEN",
        },
      ]);
    }
  };

  // Manejar cambios en el formulario de nueva variante
  const handleNewVariantChange = (
    field: keyof NewVariantData,
    value: string | number
  ): void => {
    setNewVariant((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Función para agregar nueva variante desde el modal
  const addNewVariant = (): void => {
    if (!newVariant.variant_name.trim()) {
      alert("El nombre de la variante es requerido");
      return;
    }

    const variantToAdd: VariantFormData = {
      variant_name: newVariant.variant_name,
      barcode: newVariant.barcode || "",
      sale_price: parseFloat(newVariant.sale_price) || 0,
      cost_price: parseFloat(newVariant.cost_price) || 0,
      image_url: newVariant.image_url || "",
      exchange_rate: newVariant.exchange_rate,
      sku: watchName
        ? generateSKU(watchName, newVariant.variant_name, fields.length)
        : "",
      currency: newVariant.currency,
    };

    append(variantToAdd);

    // Resetear el formulario de nueva variante
    setNewVariant({
      variant_name: "",
      barcode: "",
      sale_price: "",
      cost_price: "",
      image_url: "",
      exchange_rate: 1,
      currency: "PEN",
      sku: watchName
        ? generateSKU(watchName, newVariant.variant_name, fields.length)
        : "",
    });

    // Cerrar el modal
    (
      document.getElementById("add_variant_modal") as HTMLDialogElement
    )?.close();
  };

  // Función para procesar los tags
  const processFormData = (
    data: ProductFormData
  ): {
    product: TablesInsert<"products">;
    variants: TablesInsert<"product_variants">[];
  } => {
    const { variants, tags, ...productData } = data;

    const processedProduct: TablesInsert<"products"> = {
      ...productData,
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : null,
      category_id: productData.category_id || null, // Asegurar que sea null si está vacío
      variant: hasVariants,
      active: true,
      state: "active",
    };

    const processedVariants: TablesInsert<"product_variants">[] = variants.map(
      (variant) => ({
        variant_name: variant.variant_name,
        barcode: variant.barcode || null,
        sale_price: variant.sale_price,
        cost_price: variant.cost_price,
        image_url: variant.image_url || null,
        exchange_rate: variant.exchange_rate,
        sku: variant.sku,
        currency: variant.currency || null,
        active: true,
        // base_product_id se asignará después de crear el producto
      })
    );

    return {
      product: processedProduct,
      variants: processedVariants,
    };
  };

  const onSubmit = async (data: ProductFormData): Promise<void> => {
    const processedData = processFormData(data);

    try {
      // Crear el producto base
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([processedData.product])
        .select("id")
        .single();

      if (productError) {
        console.error("Error al crear el producto:", productError);
        return;
      }

      const baseProductId = productData.id;

      // Crear las variantes asociadas al producto base
      const variantsWithProductId = processedData.variants.map((variant) => ({
        ...variant,
        base_product_id: baseProductId,
      }));

      const { error: variantsError } = await supabase
        .from("product_variants")
        .insert(variantsWithProductId);

      if (variantsError) {
        console.error("Error al crear las variantes:", variantsError);
        return;
      }

      console.log("Producto y variantes creados exitosamente");
    } catch (error) {
      console.error("Error inesperado:", error);
    }
  };

  // Obtener categorías de Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error al obtener categorías:", error);
      } else {
        setCategories(data || []);
      }
      setLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  const clearTables = async (): Promise<void> => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas limpiar las tablas de productos y variantes? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      // Eliminar todas las filas de la tabla product_variants
      const { error: variantsError } = await supabase
        .from("product_variants")
        .delete()
        .neq("id", 0);
      if (variantsError) {
        console.error(
          "Error al limpiar la tabla product_variants:",
          variantsError
        );
        return;
      }

      // Eliminar todas las filas de la tabla products
      const { error: productsError } = await supabase
        .from("products")
        .delete()
        .neq("id", 0);
      if (productsError) {
        console.error("Error al limpiar la tabla products:", productsError);
        return;
      }

      alert("Tablas limpiadas exitosamente.");
    } catch (error) {
      console.error("Error inesperado al limpiar las tablas:", error);
    }
  };

  return (
    <div>
      <h1>Agregar Producto</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4"
      >
        {/* INFORMACIÓN DEL PRODUCTO */}
        <fieldset className="fieldset bg-base-300 rounded-box p-2 md:p-4">
          <legend className="fieldset-legend">Información del Producto</legend>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Nombre *</label>
              <input
                title="Nombre del producto"
                type="text"
                className={`input w-full ${errors.name ? "input-error" : ""}`}
                {...register("name", { required: "El nombre es requerido" })}
              />
              {errors.name && (
                <span className="text-error text-sm">
                  {errors.name.message}
                </span>
              )}
            </fieldset>

            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Marca *</label>
              <input
                title="Marca del producto"
                type="text"
                className={`input w-full ${errors.brand ? "input-error" : ""}`}
                {...register("brand", { required: "La marca es requerida" })}
              />
              {errors.brand && (
                <span className="text-error text-sm">
                  {errors.brand.message}
                </span>
              )}
            </fieldset>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">Categoría</label>
              <Select
                className={"input w-full"}
                aria-label="Categoría del producto"
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

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label">URL de Imagen Principal</label>
              <input
                title="URL de imagen del producto"
                type="text"
                className="input w-full"
                placeholder="https://ejemplo.com/imagen.jpg"
                {...register("image_url")}
              />
            </fieldset>

            <fieldset className="fieldset w-full">
              <label className="fieldset-label">
                Tags (separados por coma)
              </label>
              <input
                title="Tags del producto"
                type="text"
                className="input w-full"
                placeholder="tag1, tag2, tag3"
                {...register("tags")}
              />
            </fieldset>
          </div>

          {/* TOGGLE DE VARIANTES */}
        </fieldset>

        {/* VARIANTES */}

        <fieldset className="fieldset bg-base-200 rounded-box p-2 md:p-4">
          <legend className="fieldset-legend">Opciones de Variantes</legend>

          {/* VARIANTE BASE */}
          <fieldset className="fieldset flex flex-col">
            {/* Botón eliminar (solo si hay múltiples variantes) */}
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Nombre de Variante</label>
                <input
                  title="Nombre de la variante"
                  type="text"
                  className={`input w-full`}
                  placeholder={"unidad"}
                />
              </fieldset>
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Unidad de medida</label>
                <div className="input pr-0">
                  <input
                    title="Factor de conversión de unidades"
                    type="number"
                    className="w-full text-center font-black"
                    // disabled
                    readOnly
                    min="1"
                    step="0"
                    {...register(`variants.0.exchange_rate`, {
                      valueAsNumber: true,
                      min: { value: 0.01, message: "Debe ser mayor a 0" },
                    })}
                  />
                  <div
                    className="tooltip tooltip-left h-full"
                    data-tip="Unidad minima de venta debe ser 1 "
                  >
                    <button
                      type="button"
                      className="flex bg-base-300 h-full items-center px-3 rounded-field gap-2 w-fit border-l border-base-content/30 btn-sm"
                    >
                      UNIDAD
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1rem"
                        height="1rem"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fill="currentColor"
                          fillRule="evenodd"
                          d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M4.927 4.99Q4.5 5.634 4.5 6.26q0 .305.27.566t.661.26q.665 0 .903-.746q.252-.713.616-1.08q.364-.366 1.134-.366q.658 0 1.075.363q.416.364.416.892a.97.97 0 0 1-.136.502a2 2 0 0 1-.336.419a14 14 0 0 1-.648.558q-.51.423-.812.73q-.3.308-.483.713c-.322 1.245 1.35 1.345 1.736.456q.07-.128.213-.284q.144-.155.382-.36a41 41 0 0 0 1.194-1.034q.332-.306.573-.73a1.95 1.95 0 0 0 .242-.984q0-.712-.424-1.32q-.423-.609-1.2-.962T8.084 3.5q-1.092 0-1.911.423T4.927 4.989Zm2.14 7.08a1 1 0 1 0 2 0a1 1 0 0 0-2 0"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">
                  SKU (generado automáticamente)
                </label>
                <input
                  title="SKU de la variante"
                  type="text"
                  className="input bg-base-300 w-full"
                  {...register(`variants.0.sku`)}
                  readOnly
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <label className="fieldset-label">
                  Código de Barras (opcional)
                </label>
                <input
                  title="Código de barras"
                  type="text"
                  className="input w-full"
                  placeholder="123456789012"
                  {...register(`variants.0.barcode`)}
                />
              </fieldset>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Precio de Costo *</label>
                <input
                  title="Precio de costo"
                  type="number"
                  className={`input w-full`}
                  min="0"
                  step="0.01"
                  {...register(`variants.0.cost_price`, {
                    required: "El precio de costo es requerido",
                    valueAsNumber: true,
                    min: { value: 0, message: "Debe ser mayor o igual a 0" },
                  })}
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Precio de Venta *</label>
                <input
                  title="Precio de venta"
                  type="number"
                  className={`input w-full`}
                  min="0"
                  step="0.01"
                  {...register(`variants.0.sale_price`, {
                    required: "El precio de venta es requerido",
                    valueAsNumber: true,
                    min: { value: 0, message: "Debe ser mayor o igual a 0" },
                  })}
                />
              </fieldset>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset">
                <label className="fieldset-label">
                  URL de Imagen de Variante
                </label>
                <input
                  title="URL de imagen específica de esta variante"
                  type="text"
                  className="input w-full"
                  placeholder="https://ejemplo.com/variante.jpg"
                  {...register(`variants.0.image_url`)}
                />
              </fieldset>
            </div>
          </fieldset>
          {/* LISTA DE VARIANTES ADICIONALES */}
          <fieldset>
            <fieldset className="fieldset">
              <label className="fieldset-label">
                ¿Tiene múltiples variantes?
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasVariants"
                    className="radio"
                    checked={!hasVariants}
                    onChange={() => handleVariantToggle(false)}
                  />
                  <span>No (producto simple)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasVariants"
                    className="radio radio-success"
                    checked={hasVariants}
                    onChange={() => handleVariantToggle(true)}
                  />
                  <span>Sí (múltiples variantes)</span>
                </label>
              </div>
            </fieldset>
            {hasVariants && (
              <div className="">
                <button
                  type="button"
                  className="btn btn-soft mt-2 btn-success"
                  onClick={() =>
                    (
                      document.getElementById(
                        "add_variant_modal"
                      ) as HTMLDialogElement
                    )?.showModal()
                  }
                >
                  + Agregar Variante
                </button>
              </div>
            )}
          </fieldset>
          {/* TABLA DE VARIANTES */}
          {fields.length > 1 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Variantes adicionales</h3>
              <ul className="space-y-2">
                {fields.slice(1).map((field, idx) => (
                  <li
                    key={field.id}
                    className="flex items-center gap-2 bg-base-100 p-2 rounded shadow"
                  >
                    <div className="w-full flex items-center">
                      <div>
                        <img
                          className="w-16 h-16 object-cover rounded mr-4"
                          src={field.image_url ? field.image_url : ""}
                          alt=""
                        />
                      </div>
                      <div>
                        <div className="font-semibold">
                          Nombre: {watch("name")} {field.variant_name}{" "}
                          {watch("brand")}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {field.sku}
                        </div>
                        <div className="text-xs">
                          Precio: S/ {field.sale_price} | Costo: S/{" "}
                          {field.cost_price}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-soft btn-warning btn-xs"
                        onClick={() => remove(idx + 1)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-soft btn-error btn-xs"
                        onClick={() => remove(idx + 1)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </fieldset>

        {/* OPTIONS */}
        <div className="max-w-4xl mx-auto mt-6 absolute bottom-5 right-5">
          <button type="submit" className="btn btn-primary">
            Crear Producto
          </button>
          <button type="button" className="btn btn-outline ml-2">
            Cancelar
          </button>
        </div>
      </form>

      {/* MODAL PARA AGREGAR VARIANTE */}
      <dialog
        id="add_variant_modal"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box max-w-2xl p-4">
          <h3 className="font-bold text-lg mb-4">Agregar Nueva Variante</h3>

          <div className="flex flex-col gap-2 md:gap-4">
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Nombre de Variante</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Rojo, verde, docena, caja, pack"
                  value={newVariant.variant_name}
                  onChange={(e) =>
                    handleNewVariantChange("variant_name", e.target.value)
                  }
                />
              </fieldset>
              <div className="grid grid-cols-1 gap-2">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">Conversión a Unidad</label>
                  <div className="input w-full">
                    <input
                      type="number"
                      className="w-full text-center font-black"
                      min="1"
                      step="1"
                      value={newVariant.exchange_rate}
                      onChange={(e) =>
                        handleNewVariantChange(
                          "exchange_rate",
                          parseFloat(e.target.value) || 1
                        )
                      }
                    />
                    <span className="kbd px-4">UNIDAD</span>
                  </div>
                </fieldset>
                {/* <fieldset className="fieldset w-full">
                  <label className="fieldset-label">Unidad</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="unidad"
                    value={newVariant.unit_measurement}
                    onChange={(e) =>
                      handleNewVariantChange("unit_measurement", e.target.value)
                    }
                  />
                </fieldset> */}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">SKU</label>
                <input
                  type="text"
                  placeholder="Se genera automáticamente"
                  className="input w-full"
                  disabled
                  value={newVariant.sku}
                  readOnly
                />
              </fieldset>
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Código de Barras</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="0000000"
                  value={newVariant.barcode}
                  onChange={(e) =>
                    handleNewVariantChange("barcode", e.target.value)
                  }
                />
              </fieldset>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Precio de Costo</label>
                <input
                  type="number"
                  className="input w-full"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newVariant.cost_price}
                  onChange={(e) =>
                    handleNewVariantChange("cost_price", e.target.value)
                  }
                />
              </fieldset>

              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Precio de Venta</label>
                <input
                  type="number"
                  className="input w-full"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newVariant.sale_price}
                  onChange={(e) =>
                    handleNewVariantChange("sale_price", e.target.value)
                  }
                />
              </fieldset>
            </div>

            {/* <fieldset>
              <label className="fieldset-label">Moneda</label>
              <select
                className="input"
                value={newVariant.currency}
                onChange={(e) =>
                  handleNewVariantChange("currency", e.target.value)
                }
              >
                <option value="PEN">PEN (Soles)</option>
                <option value="USD">USD (Dólares)</option>
                <option value="EUR">EUR (Euros)</option>
              </select>
            </fieldset> */}

            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">
                  URL de Imagen de Variante
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="https://ejemplo.com/variante.jpg"
                  value={newVariant.image_url}
                  onChange={(e) =>
                    handleNewVariantChange("image_url", e.target.value)
                  }
                />
              </fieldset>
            </div>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-primary"
              onClick={addNewVariant}
            >
              Agregar Variante
            </button>
            <form method="dialog">
              <button className="btn">Cancelar</button>
            </form>
          </div>
        </div>
      </dialog>

      <button
        type="button"
        className="btn btn-error mt-4"
        onClick={clearTables}
      >
        Limpiar Tablas
      </button>
    </div>
  );
}

import supabase from "../../../supabase/config";
import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import type { TablesInsert } from "../../../../database.types"; // Ajusta la ruta según tu estructura
import { Select } from "@headlessui/react";
import { generateUniqueSKU } from "../../../utils/generateSku";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";
import Icons from "../../../components/Icons";

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
  // Estado para precios por defecto
  const [defaultPrices, setDefaultPrices] = useState({
    cost_price: "",
    sale_price: "",
  });

  // Estado para activar/desactivar precios por defecto
  const [useDefaultPrices, setUseDefaultPrices] = useState(false);

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
      variants: [], // Empezar sin variantes - todas se agregan desde modal
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const watchName = watch("name");
  const watchVariants = watch("variants");
  const watchMainImage = watch("image_url");

  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: <Icons variant="home" /> },
    {
      label: "Productos",
      href: "/products",
      icon: <Icons variant="products" />,
    },
    {
      label: "Agregar Producto",
      icon: <Icons variant="add" />,
    },
  ]);
  // Generar SKU único usando la función utilitaria
  const generateSKU = async (
    productName: string,
    variantName?: string
  ): Promise<string> => {
    if (!productName) return "";

    try {
      return await generateUniqueSKU(productName, variantName || "");
    } catch (error) {
      console.error("Error generando SKU:", error);
      // Fallback simple si la función falla
      const timestamp = Date.now().toString().slice(-4);
      const productInitials = productName
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 3);
      const variantInitial = variantName
        ? variantName.charAt(0).toUpperCase()
        : "U";
      return `${productInitials}${variantInitial}${timestamp}`;
    }
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

  // Función auxiliar para actualizar SKUs de variantes
  const updateVariantSKUs = useCallback(
    async (productName: string, variants: VariantFormData[]) => {
      if (!productName) return;

      for (let index = 0; index < variants.length; index++) {
        const variant = variants[index];
        try {
          const newSKU = await generateSKU(productName, variant.variant_name);
          setValue(`variants.${index}.sku`, newSKU);
        } catch (error) {
          console.error(`Error generando SKU para variante ${index}:`, error);
        }
      }
    },
    [setValue]
  );

  // Actualizar SKUs y slug cuando cambia el nombre del producto
  useEffect(() => {
    if (watchName) {
      setValue("slug", generateSlug(watchName));
      updateVariantSKUs(watchName, watchVariants);
    }
  }, [watchName, setValue, watchVariants, updateVariantSKUs]);

  // Actualizar SKU cuando cambia el nombre de una variante
  useEffect(() => {
    if (watchName) {
      updateVariantSKUs(watchName, watchVariants);
    }
  }, [watchName, watchVariants, updateVariantSKUs]);

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

  // Estado para edición de variantes
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );

  // Función para abrir modal para nueva variante
  const openAddVariantModal = (): void => {
    setEditingVariantIndex(null);
    const isFirstVariant = fields.length === 0;

    setNewVariant({
      variant_name: "unidad", // Valor por defecto
      barcode: "",
      sale_price: useDefaultPrices ? defaultPrices.sale_price : "", // Usar precio por defecto solo si está activado
      cost_price: useDefaultPrices ? defaultPrices.cost_price : "", // Usar precio por defecto solo si está activado
      image_url: isFirstVariant ? watchMainImage || "" : "", // Usar imagen principal solo para la primera variante
      exchange_rate: 1, // Permitir exchange_rate = 1 para cualquier variante
      currency: "PEN",
      sku: "",
    });
    (
      document.getElementById("add_variant_modal") as HTMLDialogElement
    )?.showModal();
  };

  // Función para abrir modal para editar variante
  const openEditVariantModal = (index: number): void => {
    const variant = fields[index];
    setEditingVariantIndex(index);
    setNewVariant({
      variant_name: variant.variant_name,
      barcode: variant.barcode || "",
      sale_price: variant.sale_price.toString(),
      cost_price: variant.cost_price.toString(),
      image_url: variant.image_url || "",
      exchange_rate: variant.exchange_rate,
      currency: variant.currency,
      sku: variant.sku,
    });
    (
      document.getElementById("add_variant_modal") as HTMLDialogElement
    )?.showModal();
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

  // Función para agregar/editar variante desde el modal
  const addNewVariant = async (): Promise<void> => {
    if (!newVariant.variant_name.trim()) {
      toast.error("El nombre de la variante es requerido");
      return;
    }

    // Validación de precios
    const salePrice = parseFloat(newVariant.sale_price);
    const costPrice = parseFloat(newVariant.cost_price);

    if (isNaN(salePrice) || salePrice < 0) {
      toast.error(
        "El precio de venta debe ser un número válido mayor o igual a 0"
      );
      return;
    }

    if (isNaN(costPrice) || costPrice < 0) {
      toast.error(
        "El precio de costo debe ser un número válido mayor o igual a 0"
      );
      return;
    }

    // Validación de exchange_rate
    if (newVariant.exchange_rate <= 0) {
      toast.error("La unidad de conversión debe ser mayor a 0");
      return;
    }

    // Si es la primera variante, asegurar que tenga exchange_rate = 1
    let exchangeRateToUse = newVariant.exchange_rate;
    if (
      (editingVariantIndex === null && fields.length === 0) ||
      editingVariantIndex === 0
    ) {
      exchangeRateToUse = 1; // Forzar la primera variante a 1
    }

    // Determinar la imagen a usar
    let imageToUse = newVariant.image_url || "";
    if (
      !imageToUse &&
      ((editingVariantIndex === null && fields.length === 0) ||
        editingVariantIndex === 0)
    ) {
      // Solo usar imagen principal para la primera variante si no tiene imagen específica
      imageToUse = watchMainImage || "";
    }

    // Generar SKU único
    let skuToUse = "";
    if (watchName) {
      try {
        skuToUse = await generateSKU(
          watchName,
          newVariant.variant_name || "unidad"
        );
      } catch (error) {
        console.error("Error generando SKU:", error);
        toast.error("Error generando SKU, intente nuevamente");
        return;
      }
    }

    const variantData: VariantFormData = {
      variant_name: newVariant.variant_name || "unidad", // Valor por defecto
      barcode: newVariant.barcode || "", // Opcional
      sale_price: salePrice,
      cost_price: costPrice,
      image_url: imageToUse,
      exchange_rate: exchangeRateToUse,
      sku: skuToUse,
      currency: newVariant.currency,
    };

    if (editingVariantIndex !== null) {
      // Editar variante existente
      setValue(`variants.${editingVariantIndex}`, variantData);
      toast.success("Variante actualizada exitosamente");
    } else {
      // Agregar nueva variante
      append(variantData);
      toast.success("Variante agregada exitosamente");
    }

    // Resetear el formulario de nueva variante
    setNewVariant({
      variant_name: "",
      barcode: "",
      sale_price: "",
      cost_price: "",
      image_url: "",
      exchange_rate: 1,
      currency: "PEN",
      sku: "",
    });

    setEditingVariantIndex(null);

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
      variant: variants.length > 1, // true si tiene múltiples variantes
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
    // Validar que hay al menos una variante
    if (!data.variants || data.variants.length === 0) {
      toast.error("El producto debe tener al menos una variante");
      return;
    }

    // Validar que la primera variante tiene exchange_rate = 1 (unidad mínima)
    if (data.variants[0].exchange_rate !== 1) {
      toast.error(
        "La primera variante debe tener unidad mínima (exchange_rate = 1)"
      );
      return;
    }

    // Validar que todas las variantes tienen datos válidos
    for (let i = 0; i < data.variants.length; i++) {
      const variant = data.variants[i];
      if (!variant.variant_name.trim()) {
        toast.error(`La variante ${i + 1} debe tener un nombre`);
        return;
      }
      if (variant.sale_price <= 0 || variant.cost_price <= 0) {
        toast.error(
          `La variante ${i + 1} debe tener precios válidos mayores a 0`
        );
        return;
      }
    }

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
        toast.error("Error al crear el producto");
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
        toast.error("Error al crear las variantes del producto");
        return;
      }

      toast.success("Producto y variantes creados exitosamente");

      // Opcionalmente resetear el formulario
      // reset();
    } catch (error) {
      console.error("Error inesperado:", error);
      toast.error("Error inesperado al crear el producto");
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

          {/* Precios por defecto para variantes */}
          <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4">
            <legend className="fieldset-legend">Precios por Defecto</legend>

            <label className="label">
              <span className="label-text">
                Usar precios por defecto para nuevas variantes
              </span>
              <input
                type="checkbox"
                className="toggle"
                checked={useDefaultPrices}
                onChange={(e) => setUseDefaultPrices(e.target.checked)}
              />
            </label>

            {useDefaultPrices && (
              <div className="grid grid-cols-2 gap-2 md:gap-4 mt-4">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">
                    Precio de Costo por Defecto
                  </label>
                  <input
                    title="Precio de costo por defecto para nuevas variantes"
                    type="number"
                    className="input w-full"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={defaultPrices.cost_price}
                    onChange={(e) =>
                      setDefaultPrices((prev) => ({
                        ...prev,
                        cost_price: e.target.value,
                      }))
                    }
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">
                    Precio de Venta por Defecto
                  </label>
                  <input
                    title="Precio de venta por defecto para nuevas variantes"
                    type="number"
                    className="input w-full"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={defaultPrices.sale_price}
                    onChange={(e) =>
                      setDefaultPrices((prev) => ({
                        ...prev,
                        sale_price: e.target.value,
                      }))
                    }
                  />
                </fieldset>
              </div>
            )}

            <div className="mt-2">
              <div className="text-xs text-gray-500">
                💡{" "}
                {useDefaultPrices
                  ? "Estos precios se aplicarán automáticamente a las nuevas variantes que agregues"
                  : "Activa esta opción para establecer precios por defecto"}
              </div>
            </div>
          </fieldset>

          {/* TOGGLE DE VARIANTES */}
        </fieldset>

        {/* VARIANTES */}
        <fieldset className="fieldset bg-base-200 rounded-box p-2 md:p-4">
          <legend className="fieldset-legend">Gestión de Variantes</legend>

          {/* Información sobre restricciones */}
          <div className="alert alert-info mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">Importante:</h3>
              <p className="text-sm">
                La primera variante debe tener unidad mínima (exchange_rate =
                1). Las demás variantes pueden tener cualquier valor de
                exchange_rate. Un producto debe tener al menos una variante.
              </p>
            </div>
          </div>

          {/* Botón para agregar primera variante o más variantes */}
          <div className="flex flex-col gap-4">
            {fields.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Este producto no tiene variantes aún
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddVariantModal}
                >
                  + Agregar Primera Variante (Unidad Mínima)
                </button>
              </div>
            )}

            {fields.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">
                    Variantes del Producto ({fields.length})
                  </h3>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={openAddVariantModal}
                  >
                    + Agregar Variante
                  </button>
                </div>

                {/* Tabla de variantes */}
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>SKU</th>
                        <th>Unidad</th>
                        <th>Precio Costo</th>
                        <th>Precio Venta</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => (
                        <tr
                          key={field.id}
                          className={index === 0 ? "bg-primary/10" : ""}
                        >
                          <td>
                            <div className="w-12 h-12 rounded overflow-hidden bg-base-200">
                              <img
                                className="w-full h-full object-cover"
                                src={field.image_url || "/images/no-image.webp"}
                                alt={field.variant_name}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="font-medium">
                              {field.variant_name}
                              {index === 0 && (
                                <span className="badge badge-primary badge-xs ml-2">
                                  Unidad Mínima
                                </span>
                              )}
                            </div>
                            {field.barcode && (
                              <div className="text-xs text-gray-500">
                                Código: {field.barcode}
                              </div>
                            )}
                          </td>
                          <td>
                            <code className="text-xs bg-base-200 px-2 py-1 rounded">
                              {field.sku}
                            </code>
                          </td>
                          <td>
                            <span
                              className={`badge badge-sm ${
                                index === 0 ? "badge-primary" : "badge-info"
                              }`}
                            >
                              {field.exchange_rate}
                            </span>
                          </td>
                          <td className="text-success font-medium">
                            s/ {field.cost_price.toFixed(2)}
                          </td>
                          <td className="text-error font-medium">
                            s/ {field.sale_price.toFixed(2)}
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => openEditVariantModal(index)}
                              >
                                ✏️
                              </button>
                              {fields.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs text-error"
                                  onClick={() => {
                                    if (index === 0) {
                                      toast.error(
                                        "No se puede eliminar la primera variante"
                                      );
                                      return;
                                    }
                                    remove(index);
                                    toast.success("Variante eliminada");
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
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
          <h3 className="font-bold text-lg mb-4">
            {editingVariantIndex !== null
              ? "Editar Variante"
              : "Agregar Nueva Variante"}
          </h3>

          {/* Información sobre restricciones */}
          {(editingVariantIndex === 0 ||
            (editingVariantIndex === null && fields.length === 0)) && (
            <div className="alert alert-info mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div>
                <h4 className="font-bold">Primera Variante (Unidad Mínima)</h4>
                <p className="text-sm">
                  Esta variante debe tener exchange_rate = 1 ya que representa
                  la unidad mínima del producto.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 md:gap-4">
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label">Nombre de Variante *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder={
                    editingVariantIndex === 0 ||
                    (editingVariantIndex === null && fields.length === 0)
                      ? "unidad"
                      : "Rojo, verde, docena, caja, pack"
                  }
                  value={newVariant.variant_name}
                  onChange={(e) =>
                    handleNewVariantChange("variant_name", e.target.value)
                  }
                />
              </fieldset>
              <div className="grid grid-cols-1 gap-2">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label">
                    Conversión a Unidad
                    {(editingVariantIndex === 0 ||
                      (editingVariantIndex === null &&
                        fields.length === 0)) && (
                      <span className="badge badge-primary badge-xs ml-2">
                        Fijo: 1
                      </span>
                    )}
                  </label>
                  <div className="input w-full">
                    <input
                      type="number"
                      className="w-full text-center font-black"
                      min="1"
                      step="1"
                      value={newVariant.exchange_rate}
                      disabled={
                        editingVariantIndex === 0 ||
                        (editingVariantIndex === null && fields.length === 0)
                      }
                      onChange={(e) =>
                        handleNewVariantChange(
                          "exchange_rate",
                          parseFloat(e.target.value) || 1
                        )
                      }
                    />
                    <span className="kbd px-4">UNIDAD</span>
                  </div>
                  {!(
                    editingVariantIndex === 0 ||
                    (editingVariantIndex === null && fields.length === 0)
                  ) && (
                    <div className="text-xs text-gray-500 mt-1">
                      Ej: Si es una caja de 12 unidades, coloca 12
                    </div>
                  )}
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
              {editingVariantIndex !== null
                ? "Actualizar Variante"
                : "Agregar Variante"}
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

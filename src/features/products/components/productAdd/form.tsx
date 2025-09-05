import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select } from "@headlessui/react";
import { useNavigate } from "react-router";
import supabase from "../../../../supabase/config";
import CategoryGenerator from "../../../../components/ai/CategoryGenerator";
import TagsGenerator from "../../../../components/ai/TagsGenerator";
import { useDebounce } from "../../../../hooks/useDebounce";
import { generateUniqueSKU } from "../../../../utils/generateSku";
import { toast } from "sonner";

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
  hasInventory: boolean;
  inventoryStock: string;
  inventoryMinStock: string;
  inventoryLocationId: string;
  inventorySection: string;
}

// Tipos para el modal de variantes
interface NewVariantData {
  variant_name: string;
  barcode?: string;
  sale_price: string;
  cost_price: string;
  image_url?: string;
  exchange_rate: number;
  currency: string;
  sku: string;
  hasInventory: boolean;
  inventoryStock: string;
  inventoryMinStock: string;
  inventoryLocationId: string;
  inventorySection: string;
}

interface ProductAddFormProps {
  onSubmit?: (data: ProductFormData) => void;
  aiOptionsEnabled: boolean;
  defaultPricesEnabled?: boolean;
}

export default function ProductAddForm({
  onSubmit,
  aiOptionsEnabled,
  defaultPricesEnabled = false,
}: ProductAddFormProps) {
  const navigate = useNavigate();

  // React Hook Form setup
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      brand: "generica",
      category_id: "",
      description: "",
      image_url: "",
      tags: "",
      slug: "",
      variants: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // Estados locales
  const [checkingProductName, setCheckingProductName] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<
    { id: string; name: string; brand: string }[]
  >([]);
  const [showSimilarProducts, setShowSimilarProducts] = useState(false);
  const [defaultPrices, setDefaultPrices] = useState({
    cost_price: "",
    sale_price: "",
  });

  // Estados para el modal de variantes
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );
  const [newVariant, setNewVariant] = useState<NewVariantData>({
    variant_name: "",
    barcode: "",
    sale_price: "",
    cost_price: "",
    image_url: "",
    exchange_rate: 1,
    currency: "PEN",
    sku: "",
    hasInventory: false,
    inventoryStock: "",
    inventoryMinStock: "",
    inventoryLocationId: "",
    inventorySection: "",
  });

  // Observar cambios en campos
  const watchedName = watch("name");
  const watchedBrand = watch("brand");
  const watchedCategoryId = watch("category_id");
  const watchedImageUrl = watch("image_url");
  const debouncedName = useDebounce(watchedName, 500);

  // Query para cargar categorías
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

  // Query para cargar ubicaciones (locations)
  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar productos similares cuando cambie el nombre
  useEffect(() => {
    if (!debouncedName || debouncedName.length < 3) {
      setSimilarProducts([]);
      setShowSimilarProducts(false);
      return;
    }

    setCheckingProductName(true);

    const searchSimilarProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, brand")
          .ilike("name", `%${debouncedName}%`)
          .limit(5);

        if (error) throw error;

        setSimilarProducts(data || []);
        setShowSimilarProducts((data || []).length > 0);
      } catch (error) {
        console.error("Error searching similar products:", error);
        setSimilarProducts([]);
        setShowSimilarProducts(false);
      } finally {
        setCheckingProductName(false);
      }
    };

    searchSimilarProducts();
  }, [debouncedName]);

  // Generar slug automáticamente
  useEffect(() => {
    if (watchedName && watchedBrand) {
      const slug = `${watchedName}-${watchedBrand}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  }, [watchedName, watchedBrand, setValue]);

  // Handlers
  const handleFormSubmit = useCallback(
    async (data: ProductFormData) => {
      if (fields.length === 0) {
        toast.error("Debe agregar al menos una variante al producto");
        return;
      }

      try {
        // Si hay una función onSubmit personalizada, usarla
        if (onSubmit) {
          onSubmit(data);
          return;
        }

        // Crear el producto en Supabase
        const { data: productData, error: productError } = await supabase
          .from("products")
          .insert({
            name: data.name,
            brand: data.brand,
            category_id: data.category_id || null,
            description: data.description || null,
            image_url: data.image_url || null,
            tags: data.tags
              ? data.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0)
              : null,
            slug: data.slug,
            active: true,
          })
          .select()
          .single();

        if (productError) {
          throw productError;
        }

        // Crear las variantes del producto
        const variantsToInsert = data.variants.map((variant) => ({
          base_product_id: productData.id,
          variant_name: variant.variant_name,
          barcode: variant.barcode || null,
          sale_price: variant.sale_price,
          cost_price: variant.cost_price,
          image_url: variant.image_url || null,
          exchange_rate: variant.exchange_rate,
          sku: variant.sku,
          currency: variant.currency,
          active: true,
        }));

        const { data: variantsData, error: variantsError } = await supabase
          .from("product_variants")
          .insert(variantsToInsert)
          .select();

        if (variantsError) {
          throw variantsError;
        }

        // Crear inventario para variantes que tengan exchange_rate = 1 y hasInventory = true
        const variantsWithInventory = data.variants
          .map((variant, index) => ({
            variant,
            variantId: variantsData?.[index]?.id,
          }))
          .filter(
            ({ variant, variantId }) =>
              variant.exchange_rate === 1 &&
              variant.hasInventory &&
              variantId &&
              variant.inventoryStock &&
              variant.inventoryLocationId
          );

        if (variantsWithInventory.length > 0) {
          const inventoryToInsert = variantsWithInventory.map(
            ({ variant, variantId }) => ({
              product_variant_id: variantId,
              stock: parseInt(variant.inventoryStock) || 0,
              min_stock: parseInt(variant.inventoryMinStock) || 0,
              location_id: variant.inventoryLocationId,
              section: variant.inventorySection || null,
              status: "active",
            })
          );

          const { error: inventoryError } = await supabase
            .from("inventory")
            .insert(inventoryToInsert);

          if (inventoryError) {
            console.error("Error creating inventory:", inventoryError);
            toast.error(
              "Producto creado, pero hubo un error al crear el inventario"
            );
            return;
          }
        }

        toast.success(
          `Producto "${data.name}" creado exitosamente con ${
            data.variants.length
          } variante(s)${
            variantsWithInventory.length > 0
              ? ` y ${variantsWithInventory.length} inventario(s)`
              : ""
          }`
        );

        // Limpiar el formulario
        form.reset();

        // Redirigir a la lista de productos después de 1.5 segundos
        setTimeout(() => {
          navigate("/products");
        }, 1500);
      } catch (error) {
        console.error("Error creating product:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        toast.error(`Error al crear el producto: ${errorMessage}`);
      }
    },
    [fields, onSubmit, form, navigate]
  );

  // Funciones para manejar el modal de variantes
  const handleNewVariantChange = useCallback(
    (field: keyof NewVariantData, value: string | number | boolean) => {
      setNewVariant((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const openAddVariantModal = useCallback(async () => {
    const sku = await generateUniqueSKU(
      watchedName || "PRODUCTO",
      fields.length === 0 ? "Unidad" : `Variante ${fields.length + 1}`
    );

    // Para la primera variante, usar la imagen del producto base
    // Para las demás variantes, dejar el campo vacío
    const defaultImageUrl = fields.length === 0 ? watchedImageUrl || "" : "";

    setNewVariant({
      variant_name:
        fields.length === 0 ? "Unidad" : `Variante ${fields.length + 1}`,
      sale_price: defaultPrices.sale_price || "",
      cost_price: defaultPrices.cost_price || "",
      exchange_rate: fields.length === 0 ? 1 : 1,
      sku: sku,
      currency: "PEN",
      barcode: "",
      image_url: defaultImageUrl,
      hasInventory: false,
      inventoryStock: "",
      inventoryMinStock: "",
      inventoryLocationId: "",
      inventorySection: "",
    });
    setEditingVariantIndex(null);

    // Abrir el modal
    const modal = document.getElementById(
      "add_variant_modal"
    ) as HTMLDialogElement;
    modal?.showModal();
  }, [fields.length, defaultPrices, watchedName, watchedImageUrl]);

  const closeModal = useCallback(() => {
    const modal = document.getElementById(
      "add_variant_modal"
    ) as HTMLDialogElement;
    modal?.close();
  }, []);

  const addNewVariant = useCallback(async () => {
    try {
      const variantData: VariantFormData = {
        variant_name: newVariant.variant_name,
        barcode: newVariant.barcode,
        sale_price: parseFloat(newVariant.sale_price) || 0,
        cost_price: parseFloat(newVariant.cost_price) || 0,
        image_url: newVariant.image_url,
        exchange_rate: newVariant.exchange_rate,
        sku: newVariant.sku,
        currency: newVariant.currency,
        hasInventory: newVariant.hasInventory,
        inventoryStock: newVariant.inventoryStock,
        inventoryMinStock: newVariant.inventoryMinStock,
        inventoryLocationId: newVariant.inventoryLocationId,
        inventorySection: newVariant.inventorySection,
      };

      if (editingVariantIndex !== null) {
        // Editar variante existente
        const currentFields = [...fields];
        currentFields[editingVariantIndex] = {
          ...currentFields[editingVariantIndex],
          ...variantData,
        };
        // Actualizar usando react-hook-form
        setValue("variants", currentFields);
      } else {
        // Agregar nueva variante
        append(variantData);
      }

      // Cerrar modal
      closeModal();

      toast.success(
        editingVariantIndex !== null
          ? "Variante actualizada"
          : "Variante agregada"
      );
    } catch (error) {
      console.error("Error adding variant:", error);
      toast.error("Error al agregar la variante");
    }
  }, [newVariant, editingVariantIndex, fields, append, setValue, closeModal]);

  const editVariant = useCallback(
    (index: number) => {
      const variant = fields[index] as { id: string } & VariantFormData;

      // Para la primera variante, si no tiene imagen propia, usar la del producto base
      let imageUrl = variant.image_url || "";
      if (index === 0 && !imageUrl) {
        imageUrl = watchedImageUrl || "";
      }

      setNewVariant({
        variant_name: variant.variant_name,
        barcode: variant.barcode || "",
        sale_price: variant.sale_price.toString(),
        cost_price: variant.cost_price.toString(),
        image_url: imageUrl,
        exchange_rate: variant.exchange_rate,
        currency: variant.currency,
        sku: variant.sku,
        hasInventory: variant.hasInventory || false,
        inventoryStock: variant.inventoryStock || "",
        inventoryMinStock: variant.inventoryMinStock || "",
        inventoryLocationId: variant.inventoryLocationId || "",
        inventorySection: variant.inventorySection || "",
      });
      setEditingVariantIndex(index);

      // Abrir el modal
      const modal = document.getElementById(
        "add_variant_modal"
      ) as HTMLDialogElement;
      modal?.showModal();
    },
    [fields, watchedImageUrl]
  );

  const removeVariant = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const selectSimilarProduct = useCallback(
    (product: { id: string; name: string; brand: string }) => {
      setValue("name", product.name);
      setValue("brand", product.brand);
      setShowSimilarProducts(false);
    },
    [setValue]
  );

  // Handlers para el campo brand
  const handleBrandFocus = useCallback(() => {
    const currentBrand = watchedBrand;
    if (currentBrand === "Generica") {
      setValue("brand", "");
    }
  }, [watchedBrand, setValue]);

  const handleBrandBlur = useCallback(() => {
    const currentBrand = watchedBrand;
    if (!currentBrand || currentBrand.trim() === "") {
      setValue("brand", "Generica");
    }
  }, [watchedBrand, setValue]);

  // const aiOptionsEnabled = Boolean(watchedName && watchedBrand);

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-4"
    >
      {/* INFORMACIÓN DEL PRODUCTO */}
      <fieldset className="fieldset bg-base-300 rounded-box p-2 md:p-4">
        <legend className="fieldset-legend">Información del Producto</legend>

        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <fieldset className="fieldset w-full">
            <label className="fieldset-label">Nombre *</label>
            <div className="relative">
              <input
                title="Nombre del producto"
                type="text"
                className={`input w-full ${errors.name ? "input-error" : ""}`}
                {...register("name", { required: "El nombre es requerido" })}
                onBlur={() => {
                  setTimeout(() => setShowSimilarProducts(false), 200);
                }}
                onFocus={() => {
                  if (similarProducts.length > 0) {
                    setShowSimilarProducts(true);
                  }
                }}
              />
              {checkingProductName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              )}

              {/* Dropdown de productos similares */}
              {showSimilarProducts && similarProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 text-sm text-warning font-medium border-b border-base-300">
                    ⚠️ Productos similares encontrados:
                  </div>
                  {similarProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                      onClick={() => selectSimilarProduct(product)}
                    >
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-base-content/60">
                        Marca: {product.brand}
                      </div>
                    </div>
                  ))}
                  <div className="p-2 text-xs text-base-content/60 bg-base-200">
                    💡 Haz clic en un producto para usar sus datos
                  </div>
                </div>
              )}
            </div>
            {errors.name && (
              <span className="text-error text-sm">{errors.name.message}</span>
            )}
          </fieldset>

          <fieldset className="fieldset w-full">
            <label className="fieldset-label">Marca *</label>
            <input
              title="Marca del producto"
              type="text"
              className={`input w-full ${errors.brand ? "input-error" : ""}`}
              {...register("brand", { required: "La marca es requerida" })}
              onFocus={handleBrandFocus}
              onBlur={handleBrandBlur}
            />
            {errors.brand && (
              <span className="text-error text-sm">{errors.brand.message}</span>
            )}
          </fieldset>
        </div>

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
                  disabled={!aiOptionsEnabled || !watchedName || !watchedBrand}
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
            <label className="fieldset-label">Tags (separados por coma)</label>
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
                  disabled={!aiOptionsEnabled || !watchedName || !watchedBrand}
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
                step="0.01"
                className="input w-full"
                value={defaultPrices.cost_price}
                onChange={(e) =>
                  setDefaultPrices({
                    ...defaultPrices,
                    cost_price: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </fieldset>
            <fieldset className="fieldset">
              <label className="fieldset-label">
                Precio de Venta por Defecto
              </label>
              <input
                type="number"
                step="0.01"
                className="input w-full"
                value={defaultPrices.sale_price}
                onChange={(e) =>
                  setDefaultPrices({
                    ...defaultPrices,
                    sale_price: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </fieldset>
          </div>
        )}
      </fieldset>

      {/* VARIANTES */}
      <fieldset className="fieldset bg-base-200 rounded-box p-2 md:p-4">
        <legend className="fieldset-legend">Gestión de Variantes</legend>

        <div className="flex flex-col justify-center items-center gap-4">
          {fields.length === 0 && (
            <div className="text-center py-8">
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
            <div className="space-y-4 w-full">
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

              <div className="space-y-4">
                {fields.map(
                  (field: { id: string } & VariantFormData, index: number) => (
                    <div
                      key={field.id}
                      className={`card bg-base-100 shadow-lg border-2 transition-all hover:shadow-xl wf ${
                        index === 0
                          ? "border-primary bg-primary/5"
                          : "border-base-300 hover:border-primary/50"
                      }`}
                    >
                      <div className="card-body p-4">
                        {/* Header de la variante */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="mask mask-squircle w-16 h-16">
                                <img
                                  src={
                                    field.image_url || "/images/no-image.webp"
                                  }
                                  alt={field.variant_name}
                                />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-lg flex items-center gap-2">
                                {field.variant_name}
                                {index === 0 && (
                                  <span className="badge badge-primary badge-sm">
                                    Unidad Base
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm opacity-70">
                                SKU: {field.sku}
                              </p>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => editVariant(index)}
                              title="Editar variante"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-error btn-sm"
                              onClick={() => removeVariant(index)}
                              disabled={index === 0}
                              title={
                                index === 0
                                  ? "No se puede eliminar la variante base"
                                  : "Eliminar variante"
                              }
                            >
                              🗑️ {index === 0 ? "Base" : "Eliminar"}
                            </button>
                          </div>
                        </div>

                        {/* Información de la variante */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Unidad de conversión */}
                          <div className="stat bg-base-200 rounded-box p-3">
                            <div className="stat-title text-xs">
                              Conversión a Unidad
                            </div>
                            <div className="stat-value text-2xl">
                              {field.exchange_rate}
                              <span className="text-sm ml-2 opacity-70">
                                unidades
                              </span>
                            </div>
                            <div className="stat-desc">
                              {field.exchange_rate === 1
                                ? "Unidad mínima"
                                : `Equivale a ${field.exchange_rate} unidades base`}
                            </div>
                          </div>

                          {/* Precio de costo */}
                          <div className="stat bg-base-200 rounded-box p-3">
                            <div className="stat-title text-xs">
                              Precio de Costo
                            </div>
                            <div className="stat-value text-2xl text-warning">
                              S/.{field.cost_price.toFixed(2)}
                            </div>
                            <div className="stat-desc">
                              {field.currency || "PEN"}
                            </div>
                          </div>

                          {/* Precio de venta */}
                          <div className="stat bg-base-200 rounded-box p-3">
                            <div className="stat-title text-xs">
                              Precio de Venta
                            </div>
                            <div className="stat-value text-2xl text-success">
                              S/.{field.sale_price.toFixed(2)}
                            </div>
                            <div className="stat-desc">
                              Margen:{" "}
                              {field.cost_price > 0
                                ? `${(
                                    ((field.sale_price - field.cost_price) /
                                      field.cost_price) *
                                    100
                                  ).toFixed(1)}%`
                                : "N/A"}
                            </div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="mt-4 space-y-2">
                          {field.barcode && (
                            <div className="flex items-center gap-2">
                              <span className="badge badge-outline">
                                Código de Barras:
                              </span>
                              <span className="font-mono text-sm">
                                {field.barcode}
                              </span>
                            </div>
                          )}

                          {field.image_url && (
                            <div className="flex items-center gap-2">
                              <span className="badge badge-outline">
                                Imagen:
                              </span>
                              <a
                                href={field.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary text-sm truncate max-w-xs"
                              >
                                {field.image_url}
                              </a>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="badge badge-outline">Moneda:</span>
                            <span className="text-sm">
                              {field.currency || "PEN"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {/* BOTONES DE ACCIÓN */}
      <div className="max-w-4xl bg-base-100 rounded-box p-2 shadow-xl mx-auto mt-6 absolute bottom-5 right-5">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={checkingProductName || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Creando producto...
            </>
          ) : checkingProductName ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Buscando productos similares...
            </>
          ) : (
            "Crear Producto"
          )}
        </button>
        <button type="button" className="btn btn-outline ml-2">
          Cancelar
        </button>
      </div>

      {/* MODAL PARA AGREGAR/EDITAR VARIANTES */}
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
            <div className="alert alert-info alert-soft mb-4">
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
                  Esta variante debe tener la unidad minima (1)
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
                  checked={newVariant.hasInventory}
                  onChange={(e) =>
                    handleNewVariantChange("hasInventory", e.target.checked)
                  }
                />
              </label>
            </div>

            {newVariant.hasInventory && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label">Stock Inicial</label>
                    <input
                      type="number"
                      className="input w-full"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={newVariant.inventoryStock}
                      onChange={(e) =>
                        handleNewVariantChange("inventoryStock", e.target.value)
                      }
                    />
                  </fieldset>

                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label">Stock Mínimo</label>
                    <input
                      type="number"
                      className="input w-full"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={newVariant.inventoryMinStock}
                      onChange={(e) =>
                        handleNewVariantChange(
                          "inventoryMinStock",
                          e.target.value
                        )
                      }
                    />
                  </fieldset>
                </div>

                <div className="grid grid-cols-1 gap-2 md:gap-4">
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label">Ubicación</label>
                    <select
                      className="select select-bordered w-full"
                      value={newVariant.inventoryLocationId}
                      onChange={(e) =>
                        handleNewVariantChange(
                          "inventoryLocationId",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Seleccionar ubicación</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    {loadingLocations && (
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
                      value={newVariant.inventorySection}
                      onChange={(e) =>
                        handleNewVariantChange(
                          "inventorySection",
                          e.target.value
                        )
                      }
                    />
                  </fieldset>
                </div>
              </div>
            )}
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
            <button type="button" className="btn" onClick={closeModal}>
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </form>
  );
}

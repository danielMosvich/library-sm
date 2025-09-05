import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ProductService } from "../services/productService";
import { generateProductSlug } from "../utils/generators";
import { useProductData } from "./useProductData";
import { useProductValidation } from "./useProductValidation";
import { useProductAI } from "./useProductAI";
import { useVariantManager } from "./useVariantManager";
import type { ProductFormData, VariantFormData } from "../types/product";

export const useProductForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiOptionsEnabled, setAiOptionsEnabled] = useState(false);
  const [defaultPricesEnabled, setDefaultPricesEnabled] = useState(false);
  const [defaultPrices, setDefaultPrices] = useState({
    cost_price: "",
    sale_price: "",
  });

  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      brand: "genérica",
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
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const watchName = watch("name");
  const watchVariants = watch("variants");
  const watchMainImage = watch("image_url");

  const { categories, loadingCategories, locations, loadingLocations } =
    useProductData();
  const {
    similarProducts,
    checkingProductName,
    showSimilarProducts,
    setShowSimilarProducts,
  } = useProductValidation(watchName);
  const {
    generatingCategory,
    generatingTags,
    handleAutoCategorize,
    handleGenerateTags,
  } = useProductAI(categories);

  const variantManager = useVariantManager(
    watchName,
    watchVariants,
    watchMainImage || "",
    (field: string, value: string | VariantFormData) => {
      if (typeof value === "string") {
        setValue(field as any, value);
      } else {
        setValue(field as any, value);
      }
    },
    append,
    remove,
    fields,
    defaultPricesEnabled,
    defaultPrices
  );

  const handleBrandFocus = () => {
    if (watch("brand") === "genérica") {
      setValue("brand", "");
    }
  };

  const handleBrandBlur = () => {
    if (!watch("brand")) {
      setValue("brand", "genérica");
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (isSubmitting) return;

    if (!data.name.trim()) {
      toast.error("El nombre del producto es requerido");
      return;
    }

    if (!data.variants || data.variants.length === 0) {
      toast.error("El producto debe tener al menos una variante");
      return;
    }

    if (data.variants[0].exchange_rate !== 1) {
      toast.error(
        "La primera variante debe tener unidad mínima (exchange_rate = 1)"
      );
      return;
    }

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

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Creando producto...");

    try {
      setValue("slug", generateProductSlug(data.name, data.brand));

      const productResult = await ProductService.createProduct(data);
      const variantsResult = await ProductService.createVariants(
        productResult.id,
        data.variants
      );

      const inventoryRecords = [];
      for (let i = 0; i < variantsResult.length; i++) {
        const variant = variantsResult[i];
        const inventoryData = variantManager.variantInventoryData.get(i);

        if (inventoryData && inventoryData.hasInventory) {
          const stock = parseFloat(inventoryData.inventoryStock);
          const minStock = parseFloat(inventoryData.inventoryMinStock);

          if (
            !isNaN(stock) &&
            !isNaN(minStock) &&
            inventoryData.inventoryLocationId
          ) {
            inventoryRecords.push({
              variant_id: variant.id,
              location_id: inventoryData.inventoryLocationId,
              current_stock: stock,
              min_stock: minStock,
              section: inventoryData.inventorySection || null,
              active: true,
            });
          }
        }
      }

      if (inventoryRecords.length > 0) {
        await ProductService.createInventory(inventoryRecords);
        toast.dismiss(loadingToastId);
        toast.success("Producto, variantes e inventario creados exitosamente");
      } else {
        toast.dismiss(loadingToastId);
        toast.success("Producto y variantes creados exitosamente");
      }

      navigate("/products");
    } catch (error) {
      console.error("Error inesperado:", error);
      toast.dismiss(loadingToastId);
      toast.error("Error inesperado al crear el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductAutoCategorize = async (
    productName: string,
    productBrand: string
  ) => {
    await handleAutoCategorize(
      productName,
      productBrand,
      (field: string, value: string) => {
        if (field === "category_id") setValue("category_id", value);
      }
    );
  };

  const handleProductGenerateTags = async (
    productName: string,
    categoryId: string,
    currentTags: string
  ) => {
    await handleGenerateTags(
      productName,
      categoryId,
      currentTags,
      (field: string, value: string) => {
        if (field === "tags") setValue("tags", value);
      }
    );
  };

  return {
    form: {
      register,
      handleSubmit,
      watch,
      setValue,
      errors,
    },
    fields,
    data: {
      categories,
      loadingCategories,
      locations,
      loadingLocations,
      similarProducts,
      checkingProductName,
      showSimilarProducts,
      setShowSimilarProducts,
    },
    ai: {
      aiOptionsEnabled,
      setAiOptionsEnabled,
      generatingCategory,
      generatingTags,
      handleAutoCategorize: handleProductAutoCategorize,
      handleGenerateTags: handleProductGenerateTags,
    },
    prices: {
      defaultPricesEnabled,
      setDefaultPricesEnabled,
      defaultPrices,
      setDefaultPrices,
    },
    variants: variantManager,
    handlers: {
      handleBrandFocus,
      handleBrandBlur,
      onSubmit,
    },
    state: {
      isSubmitting,
    },
  };
};

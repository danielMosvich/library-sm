import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { generateProductSKU } from "../utils/generators";
import type { NewVariantData, VariantFormData } from "../types/product";

export const useVariantManager = (
  watchName: string,
  watchVariants: VariantFormData[],
  watchMainImage: string,
  setValue: (field: string, value: string | VariantFormData) => void,
  append: (variant: VariantFormData) => void,
  remove: (index: number) => void,
  fields: Array<{ id: string } & VariantFormData>,
  defaultPricesEnabled: boolean,
  defaultPrices: { cost_price: string; sale_price: string }
) => {
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

  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );

  const [variantInventoryData, setVariantInventoryData] = useState<
    Map<
      number,
      {
        hasInventory: boolean;
        inventoryStock: string;
        inventoryMinStock: string;
        inventoryLocationId: string;
        inventorySection: string;
      }
    >
  >(new Map());

  const updateVariantSKUs = useCallback(
    async (productName: string, variants: VariantFormData[]) => {
      if (!productName) return;

      for (let index = 0; index < variants.length; index++) {
        const variant = variants[index];
        try {
          const newSKU = await generateProductSKU(
            productName,
            variant.variant_name
          );
          setValue(`variants.${index}.sku`, newSKU);
        } catch (error) {
          console.error(`Error generando SKU para variante ${index}:`, error);
        }
      }
    },
    [setValue]
  );

  useEffect(() => {
    if (watchName) {
      updateVariantSKUs(watchName, watchVariants);
    }
  }, [watchName, watchVariants, updateVariantSKUs]);

  const handleNewVariantChange = (
    field: keyof NewVariantData,
    value: string | number | boolean
  ) => {
    setNewVariant((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openAddVariantModal = () => {
    setEditingVariantIndex(null);
    const isFirstVariant = fields.length === 0;

    setNewVariant({
      variant_name: "unidad",
      barcode: "",
      sale_price: defaultPricesEnabled ? defaultPrices.sale_price : "",
      cost_price: defaultPricesEnabled ? defaultPrices.cost_price : "",
      image_url: isFirstVariant ? watchMainImage || "" : "",
      exchange_rate: 1,
      currency: "PEN",
      sku: "",
      hasInventory: false,
      inventoryStock: "",
      inventoryMinStock: "",
      inventoryLocationId: "",
      inventorySection: "",
    });

    (
      document.getElementById("add_variant_modal") as HTMLDialogElement
    )?.showModal();
  };

  const openEditVariantModal = (index: number) => {
    const variant = fields[index];
    setEditingVariantIndex(index);

    const existingInventoryData = variantInventoryData.get(index);

    setNewVariant({
      variant_name: variant.variant_name,
      barcode: variant.barcode || "",
      sale_price: variant.sale_price.toString(),
      cost_price: variant.cost_price.toString(),
      image_url: variant.image_url || "",
      exchange_rate: variant.exchange_rate,
      currency: variant.currency,
      sku: variant.sku,
      hasInventory: existingInventoryData?.hasInventory || false,
      inventoryStock: existingInventoryData?.inventoryStock || "",
      inventoryMinStock: existingInventoryData?.inventoryMinStock || "",
      inventoryLocationId: existingInventoryData?.inventoryLocationId || "",
      inventorySection: existingInventoryData?.inventorySection || "",
    });

    (
      document.getElementById("add_variant_modal") as HTMLDialogElement
    )?.showModal();
  };

  const removeVariant = (index: number) => {
    if (index === 0) {
      toast.error("No se puede eliminar la primera variante");
      return;
    }

    setVariantInventoryData((prev) => {
      const newMap = new Map(prev);
      newMap.delete(index);
      const updatedMap = new Map();
      for (const [key, value] of newMap) {
        if (key < index) {
          updatedMap.set(key, value);
        } else if (key > index) {
          updatedMap.set(key - 1, value);
        }
      }
      return updatedMap;
    });

    remove(index);
    toast.success("Variante eliminada");
  };

  const addNewVariant = async () => {
    if (!newVariant.variant_name.trim()) {
      toast.error("El nombre de la variante es requerido");
      return;
    }

    const trimmedName = newVariant.variant_name.trim().toLowerCase();
    const existingVariants = watchVariants || [];

    const variantsToCheck =
      editingVariantIndex !== null
        ? existingVariants.filter((_, index) => index !== editingVariantIndex)
        : existingVariants;

    const nameExists = variantsToCheck.some(
      (variant) => variant.variant_name.toLowerCase() === trimmedName
    );

    if (nameExists) {
      toast.error(
        `Ya existe una variante con el nombre "${newVariant.variant_name.trim()}"`
      );
      return;
    }

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

    if (newVariant.exchange_rate <= 0) {
      toast.error("La unidad de conversión debe ser mayor a 0");
      return;
    }

    if (newVariant.hasInventory) {
      const inventoryStock = parseFloat(newVariant.inventoryStock);
      const inventoryMinStock = parseFloat(newVariant.inventoryMinStock);

      if (isNaN(inventoryStock) || inventoryStock < 0) {
        toast.error(
          "El stock inicial debe ser un número válido mayor o igual a 0"
        );
        return;
      }

      if (isNaN(inventoryMinStock) || inventoryMinStock < 0) {
        toast.error(
          "El stock mínimo debe ser un número válido mayor o igual a 0"
        );
        return;
      }

      if (!newVariant.inventoryLocationId) {
        toast.error("Debe seleccionar una ubicación para el inventario");
        return;
      }
    }

    let exchangeRateToUse = newVariant.exchange_rate;
    if (
      (editingVariantIndex === null && fields.length === 0) ||
      editingVariantIndex === 0
    ) {
      exchangeRateToUse = 1;
    }

    let imageToUse = newVariant.image_url || "";
    if (
      !imageToUse &&
      ((editingVariantIndex === null && fields.length === 0) ||
        editingVariantIndex === 0)
    ) {
      imageToUse = watchMainImage || "";
    }

    let skuToUse = "";
    if (watchName) {
      try {
        skuToUse = await generateProductSKU(
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
      variant_name: newVariant.variant_name || "unidad",
      barcode: newVariant.barcode || "",
      sale_price: salePrice,
      cost_price: costPrice,
      image_url: imageToUse,
      exchange_rate: exchangeRateToUse,
      sku: skuToUse,
      currency: newVariant.currency,
    };

    if (editingVariantIndex !== null) {
      setValue(`variants.${editingVariantIndex}`, variantData);

      setVariantInventoryData((prev) => {
        const newMap = new Map(prev);
        newMap.set(editingVariantIndex, {
          hasInventory: newVariant.hasInventory,
          inventoryStock: newVariant.inventoryStock,
          inventoryMinStock: newVariant.inventoryMinStock,
          inventoryLocationId: newVariant.inventoryLocationId,
          inventorySection: newVariant.inventorySection,
        });
        return newMap;
      });

      toast.success("Variante actualizada exitosamente");
    } else {
      const newIndex = fields.length;
      append(variantData);

      setVariantInventoryData((prev) => {
        const newMap = new Map(prev);
        newMap.set(newIndex, {
          hasInventory: newVariant.hasInventory,
          inventoryStock: newVariant.inventoryStock,
          inventoryMinStock: newVariant.inventoryMinStock,
          inventoryLocationId: newVariant.inventoryLocationId,
          inventorySection: newVariant.inventorySection,
        });
        return newMap;
      });

      toast.success("Variante agregada exitosamente");
    }

    setNewVariant({
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

    setEditingVariantIndex(null);
    (
      document.getElementById("add_variant_modal") as HTMLDialogElement
    )?.close();
  };

  return {
    newVariant,
    editingVariantIndex,
    variantInventoryData,
    handleNewVariantChange,
    openAddVariantModal,
    openEditVariantModal,
    removeVariant,
    addNewVariant,
  };
};

import { useState } from "react";
import { toast } from "sonner";
import {
  generateCategoryWithAI,
  generateTagsWithAI,
} from "../../../utils/generateCategory";
import type { Category } from "../types/product";

export const useProductAI = (categories: Category[]) => {
  const [generatingCategory, setGeneratingCategory] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);

  const handleAutoCategorize = async (
    productName: string,
    productBrand: string,
    setValue: (field: string, value: string) => void
  ) => {
    if (!productName?.trim()) {
      toast.error("Ingresa el nombre del producto primero");
      return;
    }

    if (!productBrand?.trim()) {
      toast.error("Ingresa la marca del producto primero");
      return;
    }

    setGeneratingCategory(true);
    const loadingToastId = toast.loading("Categorizando con IA...");

    try {
      const subcategoryId = await generateCategoryWithAI(
        productName.trim(),
        productBrand.trim()
      );

      setValue("category_id", subcategoryId);

      const selectedCategory = categories.find(
        (cat) => cat.id === subcategoryId
      );
      const categoryName = selectedCategory?.name || "categoría seleccionada";

      toast.dismiss(loadingToastId);
      toast.success(`Categorizado como "${categoryName}"`);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(
        error instanceof Error ? error.message : "Error categorizando"
      );
    } finally {
      setGeneratingCategory(false);
    }
  };

  const handleGenerateTags = async (
    productName: string,
    categoryId: string,
    currentTags: string,
    setValue: (field: string, value: string) => void
  ) => {
    if (!productName?.trim()) {
      toast.error("Ingresa el nombre del producto primero");
      return;
    }

    if (!categoryId) {
      toast.error("Selecciona una categoría primero");
      return;
    }

    const selectedCategory = categories.find((cat) => cat.id === categoryId);
    if (!selectedCategory) {
      toast.error("Categoría no válida");
      return;
    }

    setGeneratingTags(true);
    const loadingToastId = toast.loading("Generando tags con IA...");

    try {
      const generatedTags = await generateTagsWithAI(
        productName.trim(),
        selectedCategory.name
      );

      const existingTags = currentTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const newTags = generatedTags.filter(
        (tag: string) => !existingTags.includes(tag)
      );

      const allTags = [...existingTags, ...newTags].join(", ");
      setValue("tags", allTags);

      toast.dismiss(loadingToastId);
      toast.success(`${newTags.length} tags generados`);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(
        error instanceof Error ? error.message : "Error generando tags"
      );
    } finally {
      setGeneratingTags(false);
    }
  };

  return {
    generatingCategory,
    generatingTags,
    handleAutoCategorize,
    handleGenerateTags,
  };
};

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { ProductService } from "../services/productService";
import type { ProductFormData } from "../types/product";

interface ProductVariant {
  id: string;
  variant_name: string;
  barcode: string | null;
  sale_price: number;
  cost_price: number;
  image_url: string | null;
  exchange_rate: number;
  sku: string;
  currency: string | null;
  active: boolean;
}

interface ProductWithVariants {
  id: string;
  name: string;
  brand: string;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
  tags: string[] | null;
  slug: string;
  active: boolean | null;
  variant: boolean;
  product_variants: ProductVariant[];
}

export const useProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<ProductWithVariants | null>(null);

  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      brand: "",
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
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "variants",
  });

  // Cargar producto por ID
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        navigate("/products");
        return;
      }

      try {
        setIsLoading(true);
        const productData = await ProductService.getProductById(id);
        setProduct(productData);

        // Rellenar el formulario con los datos del producto
        setValue("name", productData.name);
        setValue("brand", productData.brand);
        setValue("category_id", productData.category_id || "");
        setValue("description", productData.description || "");
        setValue("image_url", productData.image_url || "");
        setValue("tags", productData.tags ? productData.tags.join(", ") : "");
        setValue("slug", productData.slug);

        // Rellenar las variantes
        const variants = productData.product_variants
          .filter((variant: ProductVariant) => variant.active)
          .map((variant: ProductVariant) => ({
            variant_name: variant.variant_name,
            barcode: variant.barcode || "",
            sale_price: variant.sale_price,
            cost_price: variant.cost_price,
            image_url: variant.image_url || "",
            exchange_rate: variant.exchange_rate,
            sku: variant.sku,
            currency: variant.currency || "USD",
          }));

        replace(variants);
      } catch (error) {
        console.error("Error al cargar producto:", error);
        toast.error("Error al cargar el producto");
        navigate("/products");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate, setValue, replace]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;

    // Validación básica
    if (data.variants.length === 0) {
      toast.error("Debe tener al menos una variante para el producto");
      return;
    }

    try {
      setIsSubmitting(true);

      // Actualizar producto
      await ProductService.updateProduct(id, data);

      // Actualizar variantes
      if (data.variants.length > 0) {
        await ProductService.updateVariants(id, data.variants);
      }

      toast.success("Producto actualizado exitosamente");
      navigate("/products");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      toast.error("Error al actualizar el producto");
    } finally {
      setIsSubmitting(false);
    }
  };
  const addVariant = () => {
    append({
      variant_name: "",
      barcode: "",
      sale_price: 0,
      cost_price: 0,
      image_url: "",
      exchange_rate: 1,
      sku: "",
      currency: "USD",
    });
  };

  const removeVariant = (index: number) => {
    // No permitir eliminar la primera variante
    if (index === 0) {
      toast.error("No se puede eliminar la variante principal");
      return;
    }
    remove(index);
  };

  return {
    product,
    isLoading,
    isSubmitting,
    form,
    register,
    control,
    handleSubmit,
    watch,
    errors,
    fields,
    onSubmit,
    addVariant,
    removeVariant,
  };
};

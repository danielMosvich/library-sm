import { useState } from "react";
import { generateCategoryWithAI } from "../../utils/generateCategoryAI";
import Icons from "../Icons";
import clsx from "clsx";
import { toast } from "sonner";

interface CategoryGeneratorProps {
  product: {
    name: string;
    brand: string;
  };
  onSelected: (categoryId: string) => void;
  disabled?: boolean;
}

export default function CategoryGenerator({
  product,
  onSelected,
  disabled = false,
}: CategoryGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCategory = async () => {
    if (disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const categoryId = await generateCategoryWithAI(
        product.name,
        product.brand
      );
      onSelected(categoryId);
      toast.success("Categoría generada correctamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error generando categoría";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="tooltip tooltip-error" data-tip={error || ""}>
        <button
          type="button"
          onClick={handleGenerateCategory}
          disabled={disabled || isLoading}
          className={clsx("btn btn-soft btn-success")}
        >
          {isLoading ? (
            <span className="loading loading-spinner text-primary"></span>
          ) : (
            <Icons variant="ai" />
          )}
        </button>
      </div>
    </div>
  );
}

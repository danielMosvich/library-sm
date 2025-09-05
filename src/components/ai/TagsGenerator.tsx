import { useState } from "react";
import { generateTagsWithAI } from "../../utils/generateTagsAI";
import supabase from "../../supabase/config";
import Icons from "../Icons";
import clsx from "clsx";
import { toast } from "sonner";

interface TagsGeneratorProps {
  name: string;
  categoryId: string;
  onSelected: (tags: string[]) => void;
  disabled?: boolean;
}

export default function TagsGenerator({
  name,
  categoryId,
  onSelected,
  disabled = false,
}: TagsGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTags = async () => {
    if (disabled || !name.trim() || !categoryId.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Buscar el nombre de la categoría en la tabla 'categories'
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("name")
        .eq("id", categoryId)
        .single();

      if (fetchError || !data?.name) {
        throw new Error("No se encontró la categoría para el ID proporcionado");
      }

      const tags = await generateTagsWithAI(name, data.name);
      onSelected(tags);
      toast.success("Tags generados correctamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error generando tags";
      setError(errorMessage);
      console.error("Error generating tags:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="tooltip" data-tip={error || ""}>
        <button
          type="button"
          onClick={handleGenerateTags}
          disabled={disabled || isLoading || !name.trim() || !categoryId.trim()}
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

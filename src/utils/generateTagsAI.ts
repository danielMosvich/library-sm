interface TagsAPIResponse {
  success: boolean;
  data?: {
    tags: string[];
  };
  error?: {
    message: string;
    code: string;
    detalle?: string;
  };
}

export async function generateTagsWithAI(
  productName: string,
  categoryName: string
): Promise<string[]> {
  const response = await fetch(
    `${import.meta.env.VITE_AI_API_URL}/api/ai/tags`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: productName,
        category: categoryName,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result: TagsAPIResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Error desconocido");
  }

  if (!result.data?.tags || !Array.isArray(result.data.tags)) {
    throw new Error("La API no devolvió tags válidos");
  }

  return result.data.tags;
}

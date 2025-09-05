import { generateUniqueSKU } from "../../../utils/generateSku";

export const generateProductSKU = async (
  productName: string,
  variantName?: string
): Promise<string> => {
  if (!productName) return "";

  try {
    return await generateUniqueSKU(productName, variantName || "");
  } catch (error) {
    console.error("Error generando SKU:", error);
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

export const generateProductSlug = (name: string, brand: string): string => {
  const combinedText = `${name} ${brand}`.trim();
  return combinedText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

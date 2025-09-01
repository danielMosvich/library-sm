import supabase from "../supabase/config";

/**
 * Genera un SKU único para una variante de producto
 * Formato Code 128: [INICIALES_PRODUCTO][INICIAL_VARIANTE][CONTADOR][TIMESTAMP]
 * Ejemplo: ZAPROT0012024 (sin guiones, compatible con Code 128)
 */
export async function generateUniqueSKU(
  productName: string,
  variantName: string,
  brandName?: string
): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const sku = generateSKUPattern(
      productName,
      variantName,
      brandName,
      attempts
    );

    // Verificar si el SKU ya existe en la base de datos
    const isUnique = await checkSKUUniqueness(sku);

    if (isUnique) {
      return sku;
    }

    attempts++;
  }

  // Si después de 10 intentos no se encuentra un SKU único, usar timestamp más largo
  return generateFallbackSKU(productName, variantName);
}

/**
 * Genera el patrón base del SKU
 */
function generateSKUPattern(
  productName: string,
  variantName: string,
  brandName?: string,
  attempt: number = 0
): string {
  // Limpiar y normalizar strings
  const cleanProductName = cleanString(productName);
  const cleanVariantName = cleanString(variantName);
  const cleanBrandName = brandName ? cleanString(brandName) : "";

  // Obtener iniciales del producto (2-3 caracteres)
  const productInitials = getInitials(cleanProductName, 3);

  // Obtener inicial de la variante (1 caracter)
  const variantInitial = cleanVariantName.charAt(0).toUpperCase() || "U";

  // Obtener inicial de la marca (1 caracter, opcional)
  const brandInitial = cleanBrandName
    ? cleanBrandName.charAt(0).toUpperCase()
    : "";

  // Contador de intento (si es mayor a 0)
  const attemptSuffix = attempt > 0 ? attempt.toString().padStart(2, "0") : "";

  // Timestamp corto (últimos 4 dígitos del timestamp actual)
  const timestamp = Date.now().toString().slice(-4);

  // Construir SKU compatible con Code 128 (sin guiones ni caracteres especiales)
  let sku = `${productInitials}${variantInitial}${brandInitial}`;

  if (attemptSuffix) {
    sku += attemptSuffix;
  }

  // Agregar timestamp sin guión para compatibilidad Code 128
  sku += timestamp;

  return sku.toUpperCase();
}

/**
 * Genera un SKU de respaldo con timestamp completo
 */
function generateFallbackSKU(productName: string, variantName: string): string {
  const cleanProductName = cleanString(productName);
  const cleanVariantName = cleanString(variantName);

  const productInitials = getInitials(cleanProductName, 2);
  const variantInitial = cleanVariantName.charAt(0).toUpperCase() || "U";

  // Usar timestamp completo para máxima unicidad (sin guión para Code 128)
  const fullTimestamp = Date.now().toString();

  return `${productInitials}${variantInitial}${fullTimestamp}`.toUpperCase();
}

/**
 * Verifica si un SKU ya existe en la base de datos
 */
async function checkSKUUniqueness(sku: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("product_variants")
      .select("id")
      .eq("sku", sku)
      .single();

    if (error && error.code === "PGRST116") {
      // No se encontró ningún registro, el SKU es único
      return true;
    }

    if (error) {
      console.error("Error checking SKU uniqueness:", error);
      // En caso de error, asumir que no es único por seguridad
      return false;
    }

    // Si se encontró un registro, el SKU ya existe
    return false;
  } catch (error) {
    console.error("Error checking SKU uniqueness:", error);
    return false;
  }
}

/**
 * Limpia y normaliza strings para usar en SKUs
 */
function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD") // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9\s]/g, "") // Remover caracteres especiales
    .trim();
}

/**
 * Obtiene las iniciales de una cadena de texto
 */
function getInitials(str: string, maxLength: number = 3): string {
  const words = str.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) return "PRD".substring(0, maxLength);

  if (words.length === 1) {
    // Si es una sola palabra, tomar los primeros caracteres
    return words[0].substring(0, maxLength).toUpperCase();
  }

  // Si son múltiples palabras, tomar la primera letra de cada una
  let initials = words
    .map((word) => word.charAt(0))
    .join("")
    .substring(0, maxLength);

  // Si las iniciales son muy cortas, completar con caracteres de la primera palabra
  if (initials.length < maxLength && words[0].length > 1) {
    const remaining = maxLength - initials.length;
    initials += words[0].substring(1, 1 + remaining);
  }

  return initials.toUpperCase();
}

/**
 * Función de conveniencia para generar SKU con parámetros básicos
 */
export async function generateSKU(
  productName: string,
  variantName: string,
  index?: number
): Promise<string> {
  // Si se proporciona un índice, usarlo como sufijo para mantener compatibilidad
  if (typeof index === "number") {
    const baseSku = generateSKUPattern(productName, variantName);
    const indexSuffix = (index + 1).toString().padStart(2, "0");
    // Sin guión para compatibilidad Code 128
    const skuWithIndex = `${baseSku}${indexSuffix}`;

    const isUnique = await checkSKUUniqueness(skuWithIndex);
    if (isUnique) {
      return skuWithIndex;
    }
  }

  // Si no es único o no se proporciona índice, usar la función principal
  return generateUniqueSKU(productName, variantName);
}

/**
 * Función para generar múltiples SKUs únicos de una vez
 */
export async function generateMultipleSKUs(
  variants: Array<{
    productName: string;
    variantName: string;
    brandName?: string;
  }>
): Promise<string[]> {
  const skus: string[] = [];

  for (const variant of variants) {
    const sku = await generateUniqueSKU(
      variant.productName,
      variant.variantName,
      variant.brandName
    );
    skus.push(sku);
  }

  return skus;
}

/**
 * Valida si un SKU es compatible con Code 128
 */
export function isCode128Compatible(sku: string): boolean {
  // Code 128 soporta caracteres ASCII 32-126, pero usamos un subconjunto seguro
  // Letras A-Z, números 0-9 (sin espacios, guiones u otros símbolos)
  const code128Pattern = /^[A-Z0-9]+$/;
  return code128Pattern.test(sku) && sku.length >= 4 && sku.length <= 48;
}

/**
 * Genera un código de barras optimizado para Code 128
 * Longitud fija de 12 caracteres para consistencia
 */
export async function generateCode128Barcode(
  productName: string,
  variantName: string,
  brandName?: string
): Promise<string> {
  const maxAttempts = 5;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const sku = await generateUniqueSKU(productName, variantName, brandName);

    // Asegurar longitud fija de 12 caracteres para Code 128
    let normalizedSku = sku.replace(/[^A-Z0-9]/g, ""); // Remover cualquier carácter no válido

    if (normalizedSku.length > 12) {
      normalizedSku = normalizedSku.substring(0, 12);
    } else if (normalizedSku.length < 12) {
      // Rellenar con números aleatorios si es muy corto
      const padding = 12 - normalizedSku.length;
      const randomNumbers = Math.random()
        .toString()
        .slice(2, 2 + padding)
        .padStart(padding, "0");
      normalizedSku += randomNumbers;
    }

    // Verificar unicidad del código normalizado
    const isUnique = await checkSKUUniqueness(normalizedSku);
    if (isUnique && isCode128Compatible(normalizedSku)) {
      return normalizedSku;
    }

    attempts++;
  }

  // Fallback: generar código completamente aleatorio
  return generateRandomCode128();
}

/**
 * Genera un código Code 128 aleatorio como fallback
 */
function generateRandomCode128(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Función de utilidad para mostrar ejemplos de códigos generados
 * (Solo para desarrollo/testing)
 */
export async function generateExampleCodes() {
  const examples = [
    { product: "Zapatillas Running", variant: "Talla 42", brand: "Nike" },
    { product: "Camiseta Polo", variant: "Rojo" },
    { product: "Laptop Gaming", variant: "16GB RAM", brand: "ASUS" },
  ];

  console.log("=== Ejemplos de códigos Code 128 ===");

  for (const example of examples) {
    try {
      const standardSku = await generateUniqueSKU(
        example.product,
        example.variant,
        example.brand
      );

      const code128 = await generateCode128Barcode(
        example.product,
        example.variant,
        example.brand
      );

      console.log(`Producto: ${example.product} - ${example.variant}`);
      console.log(`SKU estándar: ${standardSku}`);
      console.log(`Code 128: ${code128}`);
      console.log(`Compatible: ${isCode128Compatible(code128)}`);
      console.log("---");
    } catch (error) {
      console.error("Error generando ejemplo:", error);
    }
  }
}

// Exportar función por defecto para compatibilidad
export default generateUniqueSKU;

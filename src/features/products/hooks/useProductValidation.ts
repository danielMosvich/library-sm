import { useState, useEffect } from "react";
import { ProductService } from "../services/productService";
import { useDebounce } from "../../../hooks/useDebounce";
import type { SimilarProduct } from "../types/product";

export const useProductValidation = (productName: string) => {
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [checkingProductName, setCheckingProductName] = useState(false);
  const [showSimilarProducts, setShowSimilarProducts] = useState(false);

  const debouncedProductName = useDebounce(productName, 500);

  useEffect(() => {
    const searchSimilar = async () => {
      if (!debouncedProductName || debouncedProductName.trim().length < 2) {
        setSimilarProducts([]);
        setShowSimilarProducts(false);
        setCheckingProductName(false);
        return;
      }

      setCheckingProductName(true);
      const products = await ProductService.searchSimilarProducts(
        debouncedProductName
      );
      setSimilarProducts(products);
      setShowSimilarProducts(products.length > 0);
      setCheckingProductName(false);
    };

    searchSimilar();
  }, [debouncedProductName]);

  return {
    similarProducts,
    checkingProductName,
    showSimilarProducts,
    setShowSimilarProducts,
  };
};

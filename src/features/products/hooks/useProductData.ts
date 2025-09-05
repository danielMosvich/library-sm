import { useState, useEffect } from "react";
import { ProductService } from "../services/productService";
import type { Category, Location } from "../types/product";

export const useProductData = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      const data = await ProductService.getCategories();
      setCategories(data);
      setLoadingCategories(false);
    };

    const loadLocations = async () => {
      setLoadingLocations(true);
      const data = await ProductService.getLocations();
      setLocations(data);
      setLoadingLocations(false);
    };

    loadCategories();
    loadLocations();
  }, []);

  return {
    categories,
    loadingCategories,
    locations,
    loadingLocations,
  };
};

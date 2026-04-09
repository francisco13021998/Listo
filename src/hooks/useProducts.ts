import { useCallback, useEffect, useState } from 'react';
import { CreateProductInput, Product, UpdateProductInput } from '../domain/product';
import { createProduct, deleteProduct, listProducts, updateProduct } from '../services/product.service';

const noop = () => {
  // no-op
};

export function useProducts(householdId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type ProductCreateArgs = Omit<CreateProductInput, 'householdId'> | string;
  type ProductUpdateArgs = UpdateProductInput | { id: string; name: string };

  const refresh = useCallback(async () => {
    if (!householdId) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listProducts(householdId);
      setProducts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  const create = useCallback(
    async (input: ProductCreateArgs) => {
      if (!householdId) throw new Error('No hay hogar activo');

      const productInput =
        typeof input === 'string'
          ? { householdId, name: input }
          : {
              householdId,
              name: input.name,
              brand: input.brand ?? null,
              quantity: input.quantity ?? null,
              unit: input.unit ?? null,
              category: input.category ?? null,
            };

      const createdProduct = await createProduct(productInput);
      await refresh();
      return createdProduct;
    },
    [householdId, refresh]
  );

  const update = useCallback(
    async (input: ProductUpdateArgs, nameMaybe?: string) => {
      const productInput =
        typeof input === 'string'
          ? { id: input, name: nameMaybe ?? '' }
          : {
              id: input.id,
              name: input.name,
              brand: input.brand ?? null,
              quantity: input.quantity ?? null,
              unit: input.unit ?? null,
              category: input.category ?? null,
            };

      if (!productInput.name) throw new Error('El nombre del producto es obligatorio');

      await updateProduct(productInput);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteProduct(id);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!householdId) {
    return {
      products: [],
      loading: false,
      error: null,
      refresh: noop,
      createProduct: () => Promise.reject(new Error('No hay hogar activo')),
      updateProduct: () => Promise.reject(new Error('No hay hogar activo')),
      deleteProduct: () => Promise.reject(new Error('No hay hogar activo')),
    } as const;
  }

  return {
    products,
    loading,
    error,
    refresh,
    createProduct: create,
    updateProduct: update,
    deleteProduct: remove,
  } as const;
}

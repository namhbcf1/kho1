import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient } from '@/services/api/apiClient';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Query keys factory for better cache management
export const queryKeys = {
  all: ['api'] as const,
  
  // Products
  products: {
    all: () => [...queryKeys.all, 'products'] as const,
    lists: () => [...queryKeys.products.all(), 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    categories: () => [...queryKeys.products.all(), 'categories'] as const,
    inventory: () => [...queryKeys.products.all(), 'inventory'] as const,
  },
  
  // Customers
  customers: {
    all: () => [...queryKeys.all, 'customers'] as const,
    lists: () => [...queryKeys.customers.all(), 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
  
  // Orders
  orders: {
    all: () => [...queryKeys.all, 'orders'] as const,
    lists: () => [...queryKeys.orders.all(), 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    stats: () => [...queryKeys.orders.all(), 'stats'] as const,
  },
  
  // Analytics
  analytics: {
    all: () => [...queryKeys.all, 'analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all(), 'dashboard'] as const,
    sales: (period: string) => [...queryKeys.analytics.all(), 'sales', period] as const,
    revenue: (period: string) => [...queryKeys.analytics.all(), 'revenue', period] as const,
    customers: () => [...queryKeys.analytics.all(), 'customers'] as const,
    inventory: () => [...queryKeys.analytics.all(), 'inventory'] as const,
  },
  
  // Settings
  settings: {
    all: () => [...queryKeys.all, 'settings'] as const,
    business: () => [...queryKeys.settings.all, 'business'] as const,
    payment: () => [...queryKeys.settings.all, 'payment'] as const,
    receipt: () => [...queryKeys.settings.all, 'receipt'] as const,
  },
};

// Generic API query hook
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  url: string,
  options?: Omit<UseQueryOptions<ApiResponse<T>, Error, T>, 'queryKey' | 'queryFn'> & {
    requestConfig?: any;
  }
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<T>(url, options?.requestConfig);
      if (!response.success) {
        throw new Error(response.message || 'API request failed');
      }
      return response.data!;
    },
    ...options,
  });
}

// Generic API mutation hook
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    showSuccessMessage?: boolean;
    showErrorMessage?: boolean;
    successMessage?: string;
    invalidateQueries?: readonly unknown[][];
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      if (!response.success) {
        throw new Error(response.message || 'Mutation failed');
      }
      return response.data!;
    },
    onSuccess: (data, variables, context) => {
      // Show success message
      if (options?.showSuccessMessage !== false) {
        message.success(options?.successMessage || 'Thao tác thành công!');
      }
      
      // Invalidate queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Show error message
      if (options?.showErrorMessage !== false) {
        message.error(error.message || 'Có lỗi xảy ra!');
      }
      
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

// Product hooks
export const useProducts = (filters: Record<string, any> = {}) => {
  return useApiQuery(
    queryKeys.products.list(filters),
    '/products',
    {
      requestConfig: { cache: true, cacheTTL: 2 * 60 * 1000 }, // 2 minutes cache
      staleTime: 60 * 1000, // 1 minute stale time
    }
  );
};

export const useProduct = (id: string) => {
  return useApiQuery(
    queryKeys.products.detail(id),
    `/products/${id}`,
    {
      enabled: !!id,
      requestConfig: { cache: true },
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
    }
  );
};

export const useCreateProduct = () => {
  return useApiMutation(
    (data: any) => apiClient.post('/products', data),
    {
      successMessage: 'Tạo sản phẩm thành công!',
      invalidateQueries: [
        queryKeys.products.lists(),
        queryKeys.products.categories(),
        queryKeys.analytics.inventory(),
      ],
    }
  );
};

export const useUpdateProduct = () => {
  return useApiMutation(
    ({ id, data }: { id: string; data: any }) => apiClient.put(`/products/${id}`, data),
    {
      successMessage: 'Cập nhật sản phẩm thành công!',
      invalidateQueries: [
        queryKeys.products.lists(),
        queryKeys.products.details(),
        queryKeys.products.categories(),
        queryKeys.analytics.inventory(),
      ],
    }
  );
};

export const useDeleteProduct = () => {
  return useApiMutation(
    (id: string) => apiClient.delete(`/products/${id}`),
    {
      successMessage: 'Xóa sản phẩm thành công!',
      invalidateQueries: [
        queryKeys.products.lists(),
        queryKeys.products.categories(),
        queryKeys.analytics.inventory(),
      ],
    }
  );
};

// Customer hooks
export const useCustomers = (filters: Record<string, any> = {}) => {
  return useApiQuery(
    queryKeys.customers.list(filters),
    '/customers',
    {
      requestConfig: { cache: true, cacheTTL: 3 * 60 * 1000 }, // 3 minutes cache
      staleTime: 2 * 60 * 1000, // 2 minutes stale time
    }
  );
};

export const useCustomer = (id: string) => {
  return useApiQuery(
    queryKeys.customers.detail(id),
    `/customers/${id}`,
    {
      enabled: !!id,
      requestConfig: { cache: true },
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCreateCustomer = () => {
  return useApiMutation(
    (data: any) => apiClient.post('/customers', data),
    {
      successMessage: 'Tạo khách hàng thành công!',
      invalidateQueries: [
        queryKeys.customers.lists(),
        queryKeys.analytics.customers(),
      ],
    }
  );
};

export const useUpdateCustomer = () => {
  return useApiMutation(
    ({ id, data }: { id: string; data: any }) => apiClient.put(`/customers/${id}`, data),
    {
      successMessage: 'Cập nhật khách hàng thành công!',
      invalidateQueries: [
        queryKeys.customers.lists(),
        queryKeys.customers.details(),
        queryKeys.analytics.customers(),
      ],
    }
  );
};

// Order hooks
export const useOrders = (filters: Record<string, any> = {}) => {
  return useApiQuery(
    queryKeys.orders.list(filters),
    '/orders',
    {
      requestConfig: { cache: true, cacheTTL: 1 * 60 * 1000 }, // 1 minute cache for orders
      staleTime: 30 * 1000, // 30 seconds stale time
      refetchInterval: 60 * 1000, // Refetch every minute
    }
  );
};

export const useOrder = (id: string) => {
  return useApiQuery(
    queryKeys.orders.detail(id),
    `/orders/${id}`,
    {
      enabled: !!id,
      requestConfig: { cache: true },
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useCreateOrder = () => {
  return useApiMutation(
    (data: any) => apiClient.post('/orders', data),
    {
      successMessage: 'Tạo đơn hàng thành công!',
      invalidateQueries: [
        queryKeys.orders.lists(),
        queryKeys.orders.stats(),
        queryKeys.analytics.sales('today'),
        queryKeys.analytics.revenue('today'),
        queryKeys.products.inventory(),
      ],
    }
  );
};

// Analytics hooks
export const useDashboardAnalytics = () => {
  return useApiQuery(
    queryKeys.analytics.dashboard(),
    '/analytics/dashboard',
    {
      requestConfig: { cache: true, cacheTTL: 5 * 60 * 1000 }, // 5 minutes cache
      staleTime: 3 * 60 * 1000, // 3 minutes stale time
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
};

export const useSalesAnalytics = (period: string = 'today') => {
  return useApiQuery(
    queryKeys.analytics.sales(period),
    `/analytics/sales?period=${period}`,
    {
      requestConfig: { cache: true, cacheTTL: 10 * 60 * 1000 }, // 10 minutes cache
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useRevenueAnalytics = (period: string = 'today') => {
  return useApiQuery(
    queryKeys.analytics.revenue(period),
    `/analytics/revenue?period=${period}`,
    {
      requestConfig: { cache: true, cacheTTL: 10 * 60 * 1000 },
      staleTime: 5 * 60 * 1000,
    }
  );
};

// Settings hooks
export const useBusinessSettings = () => {
  return useApiQuery(
    queryKeys.settings.business(),
    '/settings/business',
    {
      requestConfig: { cache: true, cacheTTL: 30 * 60 * 1000 }, // 30 minutes cache
      staleTime: 15 * 60 * 1000, // 15 minutes stale time
    }
  );
};

export const useUpdateBusinessSettings = () => {
  return useApiMutation(
    (data: any) => apiClient.put('/settings/business', data),
    {
      successMessage: 'Cập nhật cài đặt thành công!',
      invalidateQueries: [
        queryKeys.settings.business(),
      ],
    }
  );
};

// Bulk operations
export const useBulkDeleteProducts = () => {
  return useApiMutation(
    (ids: string[]) => apiClient.post('/products/bulk-delete', { ids }),
    {
      successMessage: 'Xóa sản phẩm thành công!',
      invalidateQueries: [
        queryKeys.products.lists(),
        queryKeys.analytics.inventory(),
      ],
    }
  );
};

// File upload hooks
export const useUploadProductImage = () => {
  return useApiMutation(
    ({ file, productId }: { file: File; productId?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (productId) {
        formData.append('productId', productId);
      }
      return apiClient.upload('/upload/product-image', formData);
    },
    {
      successMessage: 'Tải ảnh lên thành công!',
    }
  );
};

export default {
  useApiQuery,
  useApiMutation,
  queryKeys,
};
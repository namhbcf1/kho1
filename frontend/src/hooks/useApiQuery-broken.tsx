// Enhanced React Query hooks for Vietnamese POS system
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient, ApiResponse } from '../services/api/enhancedApiClient';

// Query key factory
export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
    inventory: () => [...queryKeys.products.all, 'inventory'] as const,
  },
  
  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    loyalty: () => [...queryKeys.customers.all, 'loyalty'] as const,
  },
  
  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    stats: () => [...queryKeys.orders.all, 'stats'] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    sales: (period: string) => [...queryKeys.analytics.all, 'sales', period] as const,
    revenue: (period: string) => [...queryKeys.analytics.all, 'revenue', period] as const,
    inventory: () => [...queryKeys.analytics.all, 'inventory'] as const,
    customers: () => [...queryKeys.analytics.all, 'customers'] as const,
  },
  
  // Staff
  staff: {
    all: ['staff'] as const,
    lists: () => [...queryKeys.staff.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.staff.all, 'detail', id] as const,
    performance: () => [...queryKeys.staff.all, 'performance'] as const,
    shifts: () => [...queryKeys.staff.all, 'shifts'] as const,
  },
  
  // Settings
  settings: {
    all: ['settings'] as const,
    business: () => [...queryKeys.settings.all, 'business'] as const,
    tax: () => [...queryKeys.settings.all, 'tax'] as const,
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
) {\n  return useQuery({\n    queryKey,\n    queryFn: async () => {\n      const response = await apiClient.get<T>(url, options?.requestConfig);\n      if (!response.success) {\n        throw new Error(response.message || 'API request failed');\n      }\n      return response.data!;\n    },\n    ...options,\n  });\n}\n\n// Generic API mutation hook\nexport function useApiMutation<TData, TVariables>(\n  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,\n  options?: UseMutationOptions<TData, Error, TVariables> & {\n    showSuccessMessage?: boolean;\n    showErrorMessage?: boolean;\n    successMessage?: string;\n    invalidateQueries?: readonly unknown[][];\n  }\n) {\n  const queryClient = useQueryClient();\n  \n  return useMutation({\n    mutationFn: async (variables: TVariables) => {\n      const response = await mutationFn(variables);\n      if (!response.success) {\n        throw new Error(response.message || 'Mutation failed');\n      }\n      return response.data!;\n    },\n    onSuccess: (data, variables, context) => {\n      // Show success message\n      if (options?.showSuccessMessage !== false) {\n        message.success(options?.successMessage || 'Thao tác thành công!');\n      }\n      \n      // Invalidate queries\n      if (options?.invalidateQueries) {\n        options.invalidateQueries.forEach(queryKey => {\n          queryClient.invalidateQueries({ queryKey });\n        });\n      }\n      \n      options?.onSuccess?.(data, variables, context);\n    },\n    onError: (error, variables, context) => {\n      // Show error message\n      if (options?.showErrorMessage !== false) {\n        message.error(error.message || 'Có lỗi xảy ra!');\n      }\n      \n      options?.onError?.(error, variables, context);\n    },\n    ...options,\n  });\n}\n\n// Product hooks\nexport const useProducts = (filters: Record<string, any> = {}) => {\n  return useApiQuery(\n    queryKeys.products.list(filters),\n    '/products',\n    {\n      requestConfig: { cache: true, cacheTTL: 2 * 60 * 1000 }, // 2 minutes cache\n      staleTime: 60 * 1000, // 1 minute stale time\n    }\n  );\n};\n\nexport const useProduct = (id: string) => {\n  return useApiQuery(\n    queryKeys.products.detail(id),\n    `/products/${id}`,\n    {\n      enabled: !!id,\n      requestConfig: { cache: true },\n      staleTime: 5 * 60 * 1000, // 5 minutes stale time\n    }\n  );\n};\n\nexport const useCreateProduct = () => {\n  return useApiMutation(\n    (data: any) => apiClient.post('/products', data),\n    {\n      successMessage: 'Tạo sản phẩm thành công!',\n      invalidateQueries: [\n        queryKeys.products.lists(),\n        queryKeys.products.categories(),\n        queryKeys.analytics.inventory(),\n      ],\n    }\n  );\n};\n\nexport const useUpdateProduct = () => {\n  return useApiMutation(\n    ({ id, data }: { id: string; data: any }) => apiClient.put(`/products/${id}`, data),\n    {\n      successMessage: 'Cập nhật sản phẩm thành công!',\n      invalidateQueries: [\n        queryKeys.products.lists(),\n        queryKeys.products.details(),\n        queryKeys.products.categories(),\n        queryKeys.analytics.inventory(),\n      ],\n    }\n  );\n};\n\nexport const useDeleteProduct = () => {\n  return useApiMutation(\n    (id: string) => apiClient.delete(`/products/${id}`),\n    {\n      successMessage: 'Xóa sản phẩm thành công!',\n      invalidateQueries: [\n        queryKeys.products.lists(),\n        queryKeys.products.categories(),\n        queryKeys.analytics.inventory(),\n      ],\n    }\n  );\n};\n\n// Customer hooks\nexport const useCustomers = (filters: Record<string, any> = {}) => {\n  return useApiQuery(\n    queryKeys.customers.list(filters),\n    '/customers',\n    {\n      requestConfig: { cache: true, cacheTTL: 3 * 60 * 1000 }, // 3 minutes cache\n      staleTime: 2 * 60 * 1000, // 2 minutes stale time\n    }\n  );\n};\n\nexport const useCustomer = (id: string) => {\n  return useApiQuery(\n    queryKeys.customers.detail(id),\n    `/customers/${id}`,\n    {\n      enabled: !!id,\n      requestConfig: { cache: true },\n      staleTime: 5 * 60 * 1000,\n    }\n  );\n};\n\nexport const useCreateCustomer = () => {\n  return useApiMutation(\n    (data: any) => apiClient.post('/customers', data),\n    {\n      successMessage: 'Tạo khách hàng thành công!',\n      invalidateQueries: [\n        queryKeys.customers.lists(),\n        queryKeys.analytics.customers(),\n      ],\n    }\n  );\n};\n\nexport const useUpdateCustomer = () => {\n  return useApiMutation(\n    ({ id, data }: { id: string; data: any }) => apiClient.put(`/customers/${id}`, data),\n    {\n      successMessage: 'Cập nhật khách hàng thành công!',\n      invalidateQueries: [\n        queryKeys.customers.lists(),\n        queryKeys.customers.details(),\n        queryKeys.analytics.customers(),\n      ],\n    }\n  );\n};\n\n// Order hooks\nexport const useOrders = (filters: Record<string, any> = {}) => {\n  return useApiQuery(\n    queryKeys.orders.list(filters),\n    '/orders',\n    {\n      requestConfig: { cache: true, cacheTTL: 1 * 60 * 1000 }, // 1 minute cache for orders\n      staleTime: 30 * 1000, // 30 seconds stale time\n      refetchInterval: 60 * 1000, // Refetch every minute\n    }\n  );\n};\n\nexport const useOrder = (id: string) => {\n  return useApiQuery(\n    queryKeys.orders.detail(id),\n    `/orders/${id}`,\n    {\n      enabled: !!id,\n      requestConfig: { cache: true },\n      staleTime: 2 * 60 * 1000,\n    }\n  );\n};\n\nexport const useCreateOrder = () => {\n  return useApiMutation(\n    (data: any) => apiClient.post('/orders', data),\n    {\n      successMessage: 'Tạo đơn hàng thành công!',\n      invalidateQueries: [\n        queryKeys.orders.lists(),\n        queryKeys.orders.stats(),\n        queryKeys.analytics.sales('today'),\n        queryKeys.analytics.revenue('today'),\n        queryKeys.products.inventory(),\n      ],\n    }\n  );\n};\n\n// Analytics hooks\nexport const useDashboardAnalytics = () => {\n  return useApiQuery(\n    queryKeys.analytics.dashboard(),\n    '/analytics/dashboard',\n    {\n      requestConfig: { cache: true, cacheTTL: 5 * 60 * 1000 }, // 5 minutes cache\n      staleTime: 3 * 60 * 1000, // 3 minutes stale time\n      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes\n    }\n  );\n};\n\nexport const useSalesAnalytics = (period: string = 'today') => {\n  return useApiQuery(\n    queryKeys.analytics.sales(period),\n    `/analytics/sales?period=${period}`,\n    {\n      requestConfig: { cache: true, cacheTTL: 10 * 60 * 1000 }, // 10 minutes cache\n      staleTime: 5 * 60 * 1000,\n    }\n  );\n};\n\nexport const useRevenueAnalytics = (period: string = 'today') => {\n  return useApiQuery(\n    queryKeys.analytics.revenue(period),\n    `/analytics/revenue?period=${period}`,\n    {\n      requestConfig: { cache: true, cacheTTL: 10 * 60 * 1000 },\n      staleTime: 5 * 60 * 1000,\n    }\n  );\n};\n\n// Settings hooks\nexport const useBusinessSettings = () => {\n  return useApiQuery(\n    queryKeys.settings.business(),\n    '/settings/business',\n    {\n      requestConfig: { cache: true, cacheTTL: 30 * 60 * 1000 }, // 30 minutes cache\n      staleTime: 15 * 60 * 1000, // 15 minutes stale time\n    }\n  );\n};\n\nexport const useUpdateBusinessSettings = () => {\n  return useApiMutation(\n    (data: any) => apiClient.put('/settings/business', data),\n    {\n      successMessage: 'Cập nhật cài đặt thành công!',\n      invalidateQueries: [\n        queryKeys.settings.business(),\n      ],\n    }\n  );\n};\n\n// Bulk operations\nexport const useBulkDeleteProducts = () => {\n  return useApiMutation(\n    (ids: string[]) => apiClient.post('/products/bulk-delete', { ids }),\n    {\n      successMessage: 'Xóa sản phẩm thành công!',\n      invalidateQueries: [\n        queryKeys.products.lists(),\n        queryKeys.analytics.inventory(),\n      ],\n    }\n  );\n};\n\n// File upload hooks\nexport const useUploadProductImage = () => {\n  return useApiMutation(\n    ({ file, productId }: { file: File; productId?: string }) => {\n      const formData = new FormData();\n      formData.append('file', file);\n      if (productId) {\n        formData.append('productId', productId);\n      }\n      return apiClient.upload('/upload/product-image', formData);\n    },\n    {\n      successMessage: 'Tải ảnh lên thành công!',\n    }\n  );\n};\n\nexport default {\n  useApiQuery,\n  useApiMutation,\n  queryKeys,\n};
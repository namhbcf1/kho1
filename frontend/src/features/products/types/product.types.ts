export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  barcode?: string;
  sku?: string;
  categoryId: string;
  category?: string;
  images?: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  barcode?: string;
  sku?: string;
  categoryId: string;
  images?: string[];
  active: boolean;
}

export interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
}

export interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export interface CategoryManagerProps {
  categories: Category[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export interface InventoryTrackerProps {
  products: Product[];
  loading?: boolean;
  onUpdateStock?: (productId: string, newStock: number, reason: string) => void;
}

export interface BarcodeGeneratorProps {
  product?: Product;
  onGenerate?: (barcode: string) => void;
}

export interface ImageUploaderProps {
  images?: string[];
  maxCount?: number;
  onUpload?: (images: string[]) => void;
}

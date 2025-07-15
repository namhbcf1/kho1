// Enhanced navigation hook with breadcrumb and route management
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ROUTES, MENU_ITEMS } from '../constants/routes';

export interface BreadcrumbItem {
  title: string;
  href?: string;
  key?: string;
}

export interface NavigationState {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  pageTitle: string;
  parentPath?: string;
}

export const useNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Find current menu item and build breadcrumbs
  const navigationState: NavigationState = useMemo(() => {
    const currentPath = location.pathname;
    let breadcrumbs: BreadcrumbItem[] = [];
    let pageTitle = 'Trang không xác định';
    let parentPath: string | undefined;

    // Helper function to find menu item by path
    const findMenuItem = (items: typeof MENU_ITEMS, path: string): any => {
      for (const item of items) {
        if (item.path === path) {
          return item;
        }
        if (item.children) {
          const found = findMenuItem(item.children, path);
          if (found) {
            return { parent: item, child: found };
          }
        }
      }
      return null;
    };

    // Build breadcrumbs based on current path
    const buildBreadcrumbs = () => {
      // Always start with home
      breadcrumbs.push({
        title: 'Trang chủ',
        href: ROUTES.DASHBOARD,
        key: 'home',
      });

      // Handle special cases first
      if (currentPath === ROUTES.DASHBOARD) {
        pageTitle = 'Tổng quan';
        return;
      }

      // Handle dynamic routes with parameters
      let searchPath = currentPath;
      
      // Replace dynamic segments for matching
      if (params.id) {
        searchPath = searchPath.replace(`/${params.id}`, '/:id');
      }

      // Find menu item
      const menuItem = findMenuItem(MENU_ITEMS, searchPath);

      if (menuItem) {
        if (menuItem.parent && menuItem.child) {
          // Sub-menu item
          parentPath = getParentMenuPath(menuItem.parent);
          breadcrumbs.push({
            title: menuItem.parent.label,
            href: parentPath,
            key: menuItem.parent.key,
          });
          breadcrumbs.push({
            title: menuItem.child.label,
            key: menuItem.child.key,
          });
          pageTitle = menuItem.child.label;
        } else {
          // Top-level menu item
          breadcrumbs.push({
            title: menuItem.label,
            key: menuItem.key,
          });
          pageTitle = menuItem.label;
        }
      } else {
        // Handle special dynamic routes
        if (currentPath.startsWith('/products/edit/')) {
          breadcrumbs.push(
            { title: 'Sản phẩm', href: ROUTES.PRODUCTS_LIST, key: 'products' },
            { title: 'Chỉnh sửa sản phẩm', key: 'edit-product' }
          );
          pageTitle = 'Chỉnh sửa sản phẩm';
        } else if (currentPath.startsWith('/products/view/')) {
          breadcrumbs.push(
            { title: 'Sản phẩm', href: ROUTES.PRODUCTS_LIST, key: 'products' },
            { title: 'Chi tiết sản phẩm', key: 'view-product' }
          );
          pageTitle = 'Chi tiết sản phẩm';
        } else if (currentPath.startsWith('/customers/edit/')) {
          breadcrumbs.push(
            { title: 'Khách hàng', href: ROUTES.CUSTOMERS_LIST, key: 'customers' },
            { title: 'Chỉnh sửa khách hàng', key: 'edit-customer' }
          );
          pageTitle = 'Chỉnh sửa khách hàng';
        } else if (currentPath.startsWith('/customers/view/')) {
          breadcrumbs.push(
            { title: 'Khách hàng', href: ROUTES.CUSTOMERS_LIST, key: 'customers' },
            { title: 'Chi tiết khách hàng', key: 'view-customer' }
          );
          pageTitle = 'Chi tiết khách hàng';
        } else if (currentPath.startsWith('/orders/view/')) {
          breadcrumbs.push(
            { title: 'Đơn hàng', href: ROUTES.ORDERS_LIST, key: 'orders' },
            { title: 'Chi tiết đơn hàng', key: 'view-order' }
          );
          pageTitle = 'Chi tiết đơn hàng';
        }
      }
    };

    // Get parent menu path (default to first child if no specific parent path)
    const getParentMenuPath = (parent: any): string => {
      if (parent.path) return parent.path;
      if (parent.children && parent.children[0]?.path) {
        return parent.children[0].path;
      }
      return '/';
    };

    buildBreadcrumbs();

    return {
      currentPath,
      breadcrumbs,
      pageTitle,
      parentPath,
    };
  }, [location.pathname, params]);

  // Navigation helpers
  const goTo = useCallback((path: string, replace = false) => {
    if (replace) {
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goHome = useCallback(() => {
    navigate(ROUTES.DASHBOARD);
  }, [navigate]);

  const goToParent = useCallback(() => {
    if (navigationState.parentPath) {
      navigate(navigationState.parentPath);
    } else {
      goBack();
    }
  }, [navigate, navigationState.parentPath, goBack]);

  // Route parameter helpers
  const getRouteParam = useCallback((key: string): string | undefined => {
    return params[key];
  }, [params]);

  const getCurrentId = useCallback((): string | undefined => {
    return params.id;
  }, [params.id]);

  // URL helpers
  const isCurrentPath = useCallback((path: string): boolean => {
    return location.pathname === path;
  }, [location.pathname]);

  const isPathActive = useCallback((path: string, exact = false): boolean => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // Build query string
  const buildQueryString = useCallback((params: Record<string, string | number | boolean>): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });
    return searchParams.toString();
  }, []);

  // Navigate with query parameters
  const goToWithQuery = useCallback((path: string, queryParams?: Record<string, string | number | boolean>) => {
    let fullPath = path;
    if (queryParams) {
      const queryString = buildQueryString(queryParams);
      fullPath = `${path}?${queryString}`;
    }
    navigate(fullPath);
  }, [navigate, buildQueryString]);

  return {
    // Navigation state
    ...navigationState,
    
    // Navigation methods
    goTo,
    goBack,
    goHome,
    goToParent,
    goToWithQuery,
    
    // Route helpers
    getRouteParam,
    getCurrentId,
    isCurrentPath,
    isPathActive,
    buildQueryString,
    
    // Current state
    location,
    params,
  };
};

export default useNavigation;
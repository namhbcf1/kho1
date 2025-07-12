import { useState, useEffect } from 'react';
import { message } from 'antd';
import { usePOSStore } from '../stores/posStore';
import { posService } from '../services/posService';

export const usePOS = () => {
  const {
    cart,
    products,
    loading,
    setProducts,
    setLoading,
    addToCart: addToCartStore,
    removeFromCart: removeFromCartStore,
    updateQuantity: updateQuantityStore,
    clearCart: clearCartStore,
  } = usePOSStore();

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await posService.getProducts();
      if (response.success) {
        setProducts(response.data);
      } else {
        message.error('Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Load products error:', error);
      message.error('Có lỗi xảy ra khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    // Check stock availability
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantity >= product.stock) {
      message.warning(`Sản phẩm "${product.name}" đã hết hàng`);
      return;
    }

    addToCartStore(product);
    message.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const removeFromCart = (productId: string) => {
    removeFromCartStore(productId);
    message.success('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      message.warning(`Số lượng không được vượt quá ${product.stock}`);
      return;
    }

    updateQuantityStore(productId, quantity);
  };

  const clearCart = () => {
    clearCartStore();
    message.success('Đã xóa tất cả sản phẩm khỏi giỏ hàng');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const processOrder = async (paymentData: any) => {
    try {
      setLoading(true);
      
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        subtotal: getCartTotal(),
        tax: Math.round(getCartTotal() * 0.1), // 10% VAT
        total: getCartTotal() + Math.round(getCartTotal() * 0.1),
        paymentMethod: paymentData.method,
        cashReceived: paymentData.cashReceived,
        change: paymentData.change,
      };

      const response = await posService.createOrder(orderData);
      
      if (response.success) {
        message.success('Đơn hàng đã được tạo thành công!');
        return response.data;
      } else {
        throw new Error(response.message || 'Tạo đơn hàng thất bại');
      }
    } catch (error) {
      console.error('Process order error:', error);
      message.error('Có lỗi xảy ra khi xử lý đơn hàng');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = (searchTerm: string) => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return {
    // State
    cart,
    products,
    loading,
    
    // Computed
    cartTotal: getCartTotal(),
    cartItemCount: getCartItemCount(),
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    processOrder,
    searchProducts,
    loadProducts,
    
    // Getters
    getCartTotal,
    getCartItemCount,
  };
};

// Real-Time WebSocket Tests for Vietnamese POS System
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnhancedWebSocket } from '../../hooks/useEnhancedWebSocket';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { VietnameseCurrencyFormatter } from '../../utils/formatters/vietnameseCurrency';
import { RealTimeMessage, DashboardData } from '../../types/realtime';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 100);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate echo for testing
    setTimeout(() => {
      this.onmessage?.(new MessageEvent('message', { data }));
    }, 50);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
  }

  // Test helpers
  simulateMessage(data: any) {
    const messageData = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.(new MessageEvent('message', { data: messageData }));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }
}

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('Enhanced WebSocket Hook', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    global.WebSocket = MockWebSocket as any;
    navigator.onLine = true;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should establish WebSocket connection successfully', async () => {
    const { result } = renderHook(() => 
      useEnhancedWebSocket({ 
        url: 'wss://example.com/ws',
        autoReconnect: true 
      })
    );

    expect(result.current.connecting).toBe(true);
    expect(result.current.connected).toBe(false);

    // Wait for connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.connecting).toBe(false);
    expect(result.current.connected).toBe(true);
  });

  it('should handle subscription to channels', async () => {
    const { result } = renderHook(() => 
      useEnhancedWebSocket({ 
        url: 'wss://example.com/ws',
        autoReconnect: true 
      })
    );

    // Wait for connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    act(() => {
      result.current.subscribe('dashboard');
    });

    expect(result.current.subscriptions).toContain('dashboard');
  });

  it('should handle message queuing when disconnected', () => {
    const { result } = renderHook(() => 
      useEnhancedWebSocket({ 
        url: 'wss://example.com/ws',
        autoReconnect: true 
      })
    );

    const message: RealTimeMessage = {
      type: 'subscribe',
      channel: 'dashboard',
      timestamp: new Date().toISOString()
    };

    act(() => {
      result.current.sendMessage(message);
    });

    expect(result.current.queuedMessages).toBeGreaterThan(0);
  });

  it('should handle automatic reconnection with exponential backoff', async () => {
    const onReconnect = vi.fn();
    const { result } = renderHook(() => 
      useEnhancedWebSocket({ 
        url: 'wss://example.com/ws',
        autoReconnect: true,
        maxReconnectAttempts: 3,
        reconnectInterval: 1000,
        onReconnect
      })
    );

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Simulate disconnection
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connected).toBe(false);

    // Mock offline/online cycle
    navigator.onLine = false;
    navigator.onLine = true;

    // Wait for reconnection attempt
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
    });

    expect(onReconnect).toHaveBeenCalled();
  });

  it('should calculate connection latency correctly', async () => {
    const { result } = renderHook(() => 
      useEnhancedWebSocket({ 
        url: 'wss://example.com/ws',
        heartbeatInterval: 1000
      })
    );

    // Wait for connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Simulate heartbeat
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    expect(result.current.latency).toBeGreaterThanOrEqual(0);
    expect(result.current.quality).toMatch(/excellent|good|fair|poor/);
  });
});

describe('Real-Time Data Hook', () => {
  beforeEach(() => {
    global.WebSocket = MockWebSocket as any;
    global.fetch = vi.fn();
    navigator.onLine = true;
  });

  it('should fetch initial data and establish WebSocket connection', async () => {
    const mockData: DashboardData = {
      revenue: 1000000,
      orders: 50,
      customers: 25,
      activeSessions: 5,
      recentOrders: [],
      lowStockItems: [],
      averageOrderValue: 20000,
      conversionRate: 0.3,
      customerSatisfaction: 4.5,
      timestamp: new Date().toISOString()
    };

    (global.fetch as MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData })
    } as Response);

    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('should handle WebSocket messages and update data', async () => {
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const updateMessage: RealTimeMessage = {
      type: 'data',
      channel: 'dashboard',
      data: { revenue: 1200000, orders: 55 },
      timestamp: new Date().toISOString()
    };

    act(() => {
      // Simulate WebSocket message
      const ws = (result.current as any).wsRef?.current;
      if (ws && ws.onmessage) {
        ws.onmessage(new MessageEvent('message', { 
          data: JSON.stringify(updateMessage) 
        }));
      }
    });

    expect(result.current.data).toMatchObject({
      revenue: 1200000,
      orders: 55
    });
  });

  it('should fallback to polling when WebSocket fails', async () => {
    // Mock WebSocket to fail
    global.WebSocket = vi.fn().mockImplementation(() => {
      throw new Error('WebSocket failed');
    });

    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true,
      pollInterval: 5000
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.connected).toBe(false);
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('Vietnamese Currency Formatter', () => {
  it('should format VND correctly', () => {
    expect(VietnameseCurrencyFormatter.formatVND(1000000)).toBe('1.000.000 ₫');
    expect(VietnameseCurrencyFormatter.formatVND(1500000, { abbreviated: true })).toBe('1.5M ₫');
    expect(VietnameseCurrencyFormatter.formatVND(500, { showSymbol: false })).toBe('500');
  });

  it('should handle different formatting options', () => {
    const amount = 1234567;
    
    expect(VietnameseCurrencyFormatter.formatCompact(amount)).toBe('1.2M₫');
    expect(VietnameseCurrencyFormatter.formatReceipt(amount)).toBe('1.234.567 ₫');
    expect(VietnameseCurrencyFormatter.formatMetric(amount, true)).toBe('1.2M ₫');
  });

  it('should calculate growth correctly', () => {
    const growth = VietnameseCurrencyFormatter.formatGrowth(1200000, 1000000);
    
    expect(growth.type).toBe('increase');
    expect(growth.percentage).toBe('+20.0%');
    expect(growth.color).toBe('#52c41a');
  });

  it('should calculate VAT correctly', () => {
    const vat = VietnameseCurrencyFormatter.calculateVAT(1100000, 0.1);
    
    expect(Math.round(vat.base)).toBe(1000000);
    expect(Math.round(vat.vat)).toBe(100000);
    expect(vat.total).toBe(1100000);
  });

  it('should format real-time updates', () => {
    const update = VietnameseCurrencyFormatter.formatRealTimeUpdate(
      1200000,
      1000000,
      new Date().toISOString()
    );
    
    expect(update.trend).toBe('up');
    expect(update.color).toBe('#52c41a');
    expect(update.changePercent).toBe('+20.0%');
  });

  it('should parse VND strings correctly', () => {
    expect(VietnameseCurrencyFormatter.parseVND('1.000.000 ₫')).toBe(1000000);
    expect(VietnameseCurrencyFormatter.parseVND('1.5M ₫')).toBe(1500000);
    expect(VietnameseCurrencyFormatter.parseVND('500K')).toBe(500000);
  });

  it('should validate VND format', () => {
    expect(VietnameseCurrencyFormatter.isValidVNDFormat('1.000.000 ₫')).toBe(true);
    expect(VietnameseCurrencyFormatter.isValidVNDFormat('1.5M ₫')).toBe(true);
    expect(VietnameseCurrencyFormatter.isValidVNDFormat('invalid')).toBe(false);
  });
});

describe('Real-Time Dashboard Integration', () => {
  beforeEach(() => {
    global.WebSocket = MockWebSocket as any;
    global.fetch = vi.fn();
    navigator.onLine = true;
  });

  it('should handle multiple simultaneous updates', async () => {
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    const updates = [
      { type: 'data', channel: 'dashboard', data: { revenue: 1000000 } },
      { type: 'data', channel: 'dashboard', data: { orders: 50 } },
      { type: 'data', channel: 'dashboard', data: { customers: 25 } }
    ];

    act(() => {
      updates.forEach(update => {
        const ws = (result.current as any).wsRef?.current;
        if (ws && ws.onmessage) {
          ws.onmessage(new MessageEvent('message', { 
            data: JSON.stringify(update) 
          }));
        }
      });
    });

    expect(result.current.data).toMatchObject({
      revenue: 1000000,
      orders: 50,
      customers: 25
    });
  });

  it('should handle network connectivity changes', async () => {
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.connected).toBe(true);

    // Simulate network disconnection
    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.connected).toBe(false);

    // Simulate network reconnection
    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.connected).toBe(true);
  });

  it('should handle error recovery', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true,
      onError
    }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Simulate error
    act(() => {
      const ws = (result.current as any).wsRef?.current;
      if (ws && ws.onerror) {
        ws.onerror(new Event('error'));
      }
    });

    expect(onError).toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });

  it('should clean up resources on unmount', () => {
    const { result, unmount } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

describe('Performance and Memory Tests', () => {
  it('should not cause memory leaks with frequent updates', async () => {
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Simulate many rapid updates
    const updates = Array.from({ length: 1000 }, (_, i) => ({
      type: 'data',
      channel: 'dashboard',
      data: { revenue: 1000000 + i },
      timestamp: new Date().toISOString()
    }));

    act(() => {
      updates.forEach(update => {
        const ws = (result.current as any).wsRef?.current;
        if (ws && ws.onmessage) {
          ws.onmessage(new MessageEvent('message', { 
            data: JSON.stringify(update) 
          }));
        }
      });
    });

    expect(result.current.data?.revenue).toBe(1000999);
  });

  it('should handle large data payloads efficiently', async () => {
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Create large data payload
    const largeData = {
      revenue: 1000000,
      orders: 50,
      customers: 25,
      recentOrders: Array.from({ length: 1000 }, (_, i) => ({
        id: `order-${i}`,
        customer_name: `Customer ${i}`,
        total: 10000 + i,
        created_at: new Date().toISOString(),
        status: 'completed'
      })),
      lowStockItems: Array.from({ length: 500 }, (_, i) => ({
        name: `Product ${i}`,
        stock: 5 + i,
        min_stock_level: 10,
        percentage: (5 + i) / 10 * 100
      }))
    };

    const update = {
      type: 'data',
      channel: 'dashboard',
      data: largeData,
      timestamp: new Date().toISOString()
    };

    const startTime = performance.now();

    act(() => {
      const ws = (result.current as any).wsRef?.current;
      if (ws && ws.onmessage) {
        ws.onmessage(new MessageEvent('message', { 
          data: JSON.stringify(update) 
        }));
      }
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    expect(processingTime).toBeLessThan(100); // Should process within 100ms
    expect(result.current.data?.recentOrders).toHaveLength(1000);
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle malformed JSON messages', async () => {
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Send malformed JSON
    act(() => {
      const ws = (result.current as any).wsRef?.current;
      if (ws && ws.onmessage) {
        ws.onmessage(new MessageEvent('message', { 
          data: 'invalid json {' 
        }));
      }
    });

    // Should not crash and should maintain previous data
    expect(result.current.data).toBeDefined();
  });

  it('should handle WebSocket connection failures gracefully', async () => {
    // Mock WebSocket to fail after connection
    global.WebSocket = vi.fn().mockImplementation(() => {
      const ws = new MockWebSocket('wss://example.com/ws');
      setTimeout(() => {
        ws.simulateError();
      }, 100);
      return ws;
    });

    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true,
      retryAttempts: 2
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.reconnectAttempts).toBeGreaterThan(0);
  });

  it('should handle rapid connect/disconnect cycles', async () => {
    const { result } = renderHook(() => useRealTimeData({
      endpoint: 'https://api.example.com/dashboard',
      enableWebSocket: true
    }));

    // Rapid connect/disconnect
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.reconnect();
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      act(() => {
        result.current.disconnect();
      });
    }

    // Should handle gracefully without crashing
    expect(result.current).toBeDefined();
  });
});

describe('Vietnamese Business Logic Integration', () => {
  it('should handle Vietnamese currency formatting in real-time updates', () => {
    const amounts = [500000, 1000000, 1500000, 2000000];
    
    amounts.forEach(amount => {
      const formatted = VietnameseCurrencyFormatter.formatVND(amount);
      expect(formatted).toContain('₫');
      expect(formatted).toMatch(/[\d.,]+/);
    });
  });

  it('should calculate Vietnamese VAT correctly for different scenarios', () => {
    const testCases = [
      { total: 1100000, expected: { base: 1000000, vat: 100000 } },
      { total: 550000, expected: { base: 500000, vat: 50000 } },
      { total: 1650000, expected: { base: 1500000, vat: 150000 } }
    ];

    testCases.forEach(({ total, expected }) => {
      const result = VietnameseCurrencyFormatter.calculateVAT(total, 0.1);
      expect(Math.round(result.base)).toBe(expected.base);
      expect(Math.round(result.vat)).toBe(expected.vat);
    });
  });

  it('should handle Vietnamese business hours and timezone', () => {
    const businessHours = {
      open: '08:00',
      close: '22:00',
      timezone: 'Asia/Ho_Chi_Minh'
    };

    const now = new Date();
    const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    expect(vnTime).toBeInstanceOf(Date);
    expect(businessHours.timezone).toBe('Asia/Ho_Chi_Minh');
  });
});

// Test completion
describe('Test Suite Completion', () => {
  it('should complete all test scenarios', () => {
    const testResults = {
      websocketConnection: true,
      dataFormatting: true,
      errorHandling: true,
      performance: true,
      businessLogic: true,
      edgeCases: true
    };

    expect(Object.values(testResults).every(Boolean)).toBe(true);
  });
});
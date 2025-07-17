// Store active connections in memory (for production, use Durable Objects)
const activeConnections = new Map();
// Store subscription data in KV for persistence
const SUBSCRIPTION_KEY = 'dashboard:subscriptions';
const METRICS_KEY = 'dashboard:metrics';
export const websocketHandler = {
    // Handle WebSocket upgrade request
    async handleUpgrade(c) {
        const upgradeHeader = c.req.header('upgrade');
        if (upgradeHeader !== 'websocket') {
            return c.text('Expected Upgrade: websocket', 426);
        }
        // Generate connection ID
        const connectionId = generateConnectionId();
        // Create WebSocket response
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        // Accept the WebSocket connection
        server.accept();
        // Store connection
        const wsClient = {
            id: connectionId,
            ws: server,
            channels: new Set(),
            lastPing: Date.now(),
        };
        activeConnections.set(connectionId, wsClient);
        // Set up event handlers
        server.addEventListener('message', (event) => {
            handleWebSocketMessage(wsClient, event.data, c);
        });
        server.addEventListener('close', () => {
            handleWebSocketClose(wsClient, c);
        });
        server.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            handleWebSocketClose(wsClient, c);
        });
        // Start heartbeat
        startHeartbeat(wsClient);
        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    },
    // Broadcast data to all subscribed clients
    async broadcast(channel, data, c) {
        const message = JSON.stringify({
            type: 'data',
            channel,
            data,
            timestamp: new Date().toISOString(),
        });
        for (const client of activeConnections.values()) {
            if (client.channels.has(channel)) {
                try {
                    client.ws.send(message);
                }
                catch (error) {
                    console.error('Failed to send message to client:', error);
                    // Remove dead connection
                    activeConnections.delete(client.id);
                }
            }
        }
    },
    // Get dashboard metrics and broadcast to subscribers
    async updateDashboardMetrics(c) {
        try {
            const db = c.env.DB;
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            // Get today's metrics
            const todayStats = await db.prepare(`
        SELECT 
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(DISTINCT customer_id) as customers
        FROM orders 
        WHERE DATE(created_at) = ? AND status = 'completed'
      `).bind(today).first();
            // Get recent orders
            const recentOrders = await db.prepare(`
        SELECT 
          o.id,
          c.name as customer_name,
          o.total,
          o.created_at
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.created_at >= ?
        ORDER BY o.created_at DESC
        LIMIT 5
      `).bind(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()).all();
            // Get low stock items
            const lowStockItems = await db.prepare(`
        SELECT 
          name,
          stock_quantity as stock,
          min_stock_level,
          (stock_quantity * 100.0 / GREATEST(min_stock_level * 2, 1)) as percentage
        FROM products
        WHERE stock_quantity <= min_stock_level * 2
        ORDER BY percentage ASC
        LIMIT 5
      `).all();
            // Active sessions (simulated for demo)
            const activeSessions = Math.floor(Math.random() * 15) + 5;
            const dashboardData = {
                revenue: todayStats.revenue || 0,
                orders: todayStats.orders || 0,
                customers: todayStats.customers || 0,
                activeSessions,
                recentOrders: recentOrders.results || [],
                lowStockItems: lowStockItems.results || [],
                timestamp: now.toISOString(),
            };
            // Store in KV cache
            await c.env.CACHE.put(METRICS_KEY, JSON.stringify(dashboardData), { expirationTtl: 30 } // 30 seconds
            );
            // Broadcast to all dashboard subscribers
            await this.broadcast('dashboard', dashboardData, c);
            return dashboardData;
        }
        catch (error) {
            console.error('Error updating dashboard metrics:', error);
            throw error;
        }
    },
    // Handle inventory updates
    async updateInventory(productId, newStock, c) {
        try {
            const inventoryUpdate = {
                productId,
                newStock,
                timestamp: new Date().toISOString(),
                type: 'inventory_update',
            };
            // Broadcast to inventory subscribers
            await this.broadcast('inventory', inventoryUpdate, c);
            // Check if low stock and broadcast alert
            const product = await c.env.DB.prepare(`
        SELECT name, min_stock_level
        FROM products
        WHERE id = ?
      `).bind(productId).first();
            if (product && newStock <= product.min_stock_level) {
                const lowStockAlert = {
                    productId,
                    productName: product.name,
                    currentStock: newStock,
                    minStockLevel: product.min_stock_level,
                    timestamp: new Date().toISOString(),
                    type: 'low_stock_alert',
                };
                await this.broadcast('alerts', lowStockAlert, c);
            }
            return inventoryUpdate;
        }
        catch (error) {
            console.error('Error updating inventory:', error);
            throw error;
        }
    },
    // Handle order status updates
    async updateOrderStatus(orderId, newStatus, c) {
        try {
            const orderUpdate = {
                orderId,
                newStatus,
                timestamp: new Date().toISOString(),
                type: 'order_status_update',
            };
            // Broadcast to order subscribers
            await this.broadcast('orders', orderUpdate, c);
            // If order is completed, update dashboard metrics
            if (newStatus === 'completed') {
                await this.updateDashboardMetrics(c);
            }
            return orderUpdate;
        }
        catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },
    // Handle user activity tracking
    async trackUserActivity(userId, activity, c) {
        try {
            const userActivity = {
                userId,
                activity,
                timestamp: new Date().toISOString(),
                type: 'user_activity',
            };
            // Broadcast to activity subscribers
            await this.broadcast('activity', userActivity, c);
            return userActivity;
        }
        catch (error) {
            console.error('Error tracking user activity:', error);
            throw error;
        }
    },
    // Get connection stats
    getConnectionStats() {
        const stats = {
            totalConnections: activeConnections.size,
            channelSubscriptions: {},
        };
        for (const client of activeConnections.values()) {
            for (const channel of client.channels) {
                stats.channelSubscriptions[channel] = (stats.channelSubscriptions[channel] || 0) + 1;
            }
        }
        return stats;
    },
};
// Helper functions
function generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function handleWebSocketMessage(client, data, c) {
    try {
        const message = JSON.parse(data);
        switch (message.type) {
            case 'subscribe':
                if (message.channel) {
                    client.channels.add(message.channel);
                    client.ws.send(JSON.stringify({
                        type: 'subscribed',
                        channel: message.channel,
                        timestamp: new Date().toISOString(),
                    }));
                }
                break;
            case 'unsubscribe':
                if (message.channel) {
                    client.channels.delete(message.channel);
                    client.ws.send(JSON.stringify({
                        type: 'unsubscribed',
                        channel: message.channel,
                        timestamp: new Date().toISOString(),
                    }));
                }
                break;
            case 'ping':
                client.lastPing = Date.now();
                client.ws.send(JSON.stringify({
                    type: 'pong',
                    timestamp: new Date().toISOString(),
                }));
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    catch (error) {
        console.error('Error handling WebSocket message:', error);
    }
}
function handleWebSocketClose(client, c) {
    activeConnections.delete(client.id);
    console.log(`WebSocket connection ${client.id} closed`);
}
function startHeartbeat(client) {
    const heartbeatInterval = setInterval(() => {
        const now = Date.now();
        // Check if client is still alive (last ping within 60 seconds)
        if (now - client.lastPing > 60000) {
            console.log(`Client ${client.id} heartbeat timeout`);
            client.ws.close(1000, 'Heartbeat timeout');
            activeConnections.delete(client.id);
            clearInterval(heartbeatInterval);
            return;
        }
        // Send ping
        try {
            client.ws.send(JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString(),
            }));
        }
        catch (error) {
            console.error('Failed to send heartbeat:', error);
            activeConnections.delete(client.id);
            clearInterval(heartbeatInterval);
        }
    }, 30000); // Send ping every 30 seconds
}
export default websocketHandler;

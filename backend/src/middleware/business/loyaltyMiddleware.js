export const loyaltyMiddleware = async (c, next) => {
    try {
        const method = c.req.method;
        const path = c.req.path;
        // Process loyalty points for completed orders
        if (method === 'POST' && (path.includes('/orders') || path.includes('/pos'))) {
            const body = await c.req.json();
            if (body.customerId) {
                // Calculate loyalty points for this order
                const loyaltyCalculation = await calculateLoyaltyPoints(c, body);
                c.set('loyaltyCalculation', loyaltyCalculation);
            }
        }
        await next();
        // Award points after successful order creation
        const loyaltyCalculation = c.get('loyaltyCalculation');
        const orderId = c.get('orderId');
        if (loyaltyCalculation && orderId) {
            await awardLoyaltyPoints(c, loyaltyCalculation, orderId);
        }
    }
    catch (error) {
        console.error('Loyalty middleware error:', error);
        await next();
    }
};
export const calculateLoyaltyPoints = async (c, orderData) => {
    try {
        const db = c.env.DB;
        // Get loyalty settings
        const loyaltySettings = await getLoyaltySettings(c);
        if (!loyaltySettings.enabled) {
            return null;
        }
        // Get customer info
        const customer = await db.prepare(`
      SELECT id, loyalty_points, total_spent, tier_id FROM customers WHERE id = ?
    `).bind(orderData.customerId).first();
        if (!customer) {
            return null;
        }
        // Calculate points to earn
        const orderTotal = orderData.total || 0;
        let pointsToEarn = 0;
        if (orderTotal >= loyaltySettings.minimumOrderForPoints) {
            pointsToEarn = Math.floor(orderTotal * loyaltySettings.pointsPerVND);
            // Apply tier multiplier if customer has a tier
            if (customer.tier_id) {
                const tier = await getTierById(c, customer.tier_id);
                if (tier) {
                    pointsToEarn = Math.floor(pointsToEarn * tier.pointsMultiplier);
                }
            }
        }
        // Handle points redemption if requested
        let pointsToRedeem = 0;
        let redemptionDiscount = 0;
        if (orderData.usePoints && orderData.pointsToUse > 0) {
            pointsToRedeem = Math.min(orderData.pointsToUse, customer.loyalty_points);
            redemptionDiscount = pointsToRedeem * loyaltySettings.redemptionRate;
        }
        return {
            customerId: orderData.customerId,
            pointsToEarn,
            pointsToRedeem,
            redemptionDiscount,
            newPointsBalance: customer.loyalty_points + pointsToEarn - pointsToRedeem,
        };
    }
    catch (error) {
        console.error('Calculate loyalty points error:', error);
        return null;
    }
};
export const awardLoyaltyPoints = async (c, loyaltyCalculation, orderId) => {
    try {
        const db = c.env.DB;
        if (loyaltyCalculation.pointsToEarn > 0) {
            // Add points to customer
            await db.prepare(`
        UPDATE customers 
        SET loyalty_points = loyalty_points + ?
        WHERE id = ?
      `).bind(loyaltyCalculation.pointsToEarn, loyaltyCalculation.customerId).run();
            // Create points transaction
            await db.prepare(`
        INSERT INTO loyalty_transactions (
          id, customer_id, order_id, type, points, description, created_at
        )
        VALUES (?, ?, ?, 'earn', ?, ?, datetime('now'))
      `).bind(crypto.randomUUID(), loyaltyCalculation.customerId, orderId, loyaltyCalculation.pointsToEarn, `Earned points from order ${orderId}`).run();
        }
        if (loyaltyCalculation.pointsToRedeem > 0) {
            // Deduct redeemed points
            await db.prepare(`
        UPDATE customers 
        SET loyalty_points = loyalty_points - ?
        WHERE id = ?
      `).bind(loyaltyCalculation.pointsToRedeem, loyaltyCalculation.customerId).run();
            // Create redemption transaction
            await db.prepare(`
        INSERT INTO loyalty_transactions (
          id, customer_id, order_id, type, points, description, created_at
        )
        VALUES (?, ?, ?, 'redeem', ?, ?, datetime('now'))
      `).bind(crypto.randomUUID(), loyaltyCalculation.customerId, orderId, -loyaltyCalculation.pointsToRedeem, `Redeemed points for order ${orderId}`).run();
        }
        // Check for tier upgrade
        await checkTierUpgrade(c, loyaltyCalculation.customerId);
    }
    catch (error) {
        console.error('Award loyalty points error:', error);
    }
};
export const getLoyaltySettings = async (c) => {
    try {
        const db = c.env.DB;
        const settings = await db.prepare(`
      SELECT key, value FROM settings WHERE category = 'loyalty'
    `).all();
        const loyaltySettings = {
            enabled: true,
            pointsPerVND: 0.001, // 1 point per 1000 VND
            minimumOrderForPoints: 10000, // Minimum 10,000 VND
            redemptionRate: 1000, // 1000 points = 1000 VND
            minimumRedemption: 1000, // Minimum 1000 points to redeem
            pointsExpiryDays: 365, // Points expire after 1 year
        };
        for (const setting of settings.results || []) {
            try {
                loyaltySettings[setting.key] = JSON.parse(setting.value);
            }
            catch (parseError) {
                console.warn(`Failed to parse loyalty setting ${setting.key}:`, parseError);
            }
        }
        return loyaltySettings;
    }
    catch (error) {
        console.error('Get loyalty settings error:', error);
        return {
            enabled: false,
            pointsPerVND: 0.001,
            minimumOrderForPoints: 10000,
            redemptionRate: 1000,
            minimumRedemption: 1000,
            pointsExpiryDays: 365,
        };
    }
};
export const getTierById = async (c, tierId) => {
    try {
        const db = c.env.DB;
        const tier = await db.prepare(`
      SELECT * FROM loyalty_tiers WHERE id = ?
    `).bind(tierId).first();
        return tier;
    }
    catch (error) {
        console.error('Get tier error:', error);
        return null;
    }
};
export const checkTierUpgrade = async (c, customerId) => {
    try {
        const db = c.env.DB;
        // Get customer's total spent
        const customer = await db.prepare(`
      SELECT total_spent, tier_id FROM customers WHERE id = ?
    `).bind(customerId).first();
        if (!customer)
            return;
        // Get all tiers ordered by minimum spent
        const tiers = await db.prepare(`
      SELECT * FROM loyalty_tiers ORDER BY minimum_spent DESC
    `).all();
        // Find the highest tier the customer qualifies for
        let newTierId = null;
        for (const tier of tiers.results || []) {
            if (customer.total_spent >= tier.minimum_spent) {
                newTierId = tier.id;
                break;
            }
        }
        // Update tier if changed
        if (newTierId && newTierId !== customer.tier_id) {
            await db.prepare(`
        UPDATE customers SET tier_id = ? WHERE id = ?
      `).bind(newTierId, customerId).run();
            // Create tier upgrade notification
            await db.prepare(`
        INSERT INTO notifications (
          id, customer_id, type, title, message, created_at
        )
        VALUES (?, ?, 'tier_upgrade', ?, ?, datetime('now'))
      `).bind(crypto.randomUUID(), customerId, 'Tier Upgrade', 'Congratulations! You have been upgraded to a new loyalty tier.').run();
        }
    }
    catch (error) {
        console.error('Check tier upgrade error:', error);
    }
};

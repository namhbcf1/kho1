export const taxMiddleware = async (c, next) => {
    try {
        const method = c.req.method;
        const path = c.req.path;
        // Apply tax calculation for order creation/update
        if ((method === 'POST' || method === 'PUT') && (path.includes('/orders') || path.includes('/pos'))) {
            const body = await c.req.json();
            if (body.items && Array.isArray(body.items)) {
                // Get tax settings
                const taxSettings = await getTaxSettings(c);
                if (taxSettings.enabled) {
                    const taxCalculation = calculateTax(body, taxSettings);
                    // Add tax calculation to request body
                    body.taxRate = taxSettings.rate;
                    body.taxAmount = taxCalculation.taxAmount;
                    body.subtotal = taxCalculation.subtotal;
                    body.total = taxCalculation.total;
                    // Store updated body
                    c.set('processedBody', body);
                }
            }
        }
        await next();
    }
    catch (error) {
        console.error('Tax middleware error:', error);
        await next();
    }
};
export const calculateTax = (orderData, taxSettings) => {
    let subtotal = 0;
    // Calculate subtotal from items
    for (const item of orderData.items) {
        const itemTotal = item.price * item.quantity;
        const itemDiscount = item.discountAmount || 0;
        subtotal += itemTotal - itemDiscount;
    }
    // Apply order-level discount
    const orderDiscount = orderData.discountAmount || 0;
    subtotal -= orderDiscount;
    let taxAmount = 0;
    let total = subtotal;
    if (taxSettings.enabled) {
        if (taxSettings.method === 'inclusive') {
            // Tax is included in the price
            taxAmount = subtotal * (taxSettings.rate / (1 + taxSettings.rate));
            total = subtotal;
        }
        else {
            // Tax is added to the price
            taxAmount = subtotal * taxSettings.rate;
            total = subtotal + taxAmount;
        }
    }
    return {
        subtotal,
        taxAmount: Math.round(taxAmount),
        total: Math.round(total),
        taxRate: taxSettings.rate,
    };
};
export const getTaxSettings = async (c) => {
    try {
        const db = c.env.DB;
        const settings = await db.prepare(`
      SELECT key, value FROM settings WHERE category = 'tax'
    `).all();
        const taxSettings = {
            enabled: false,
            rate: 0.1, // Default 10% VAT
            method: 'exclusive',
            exemptProducts: [],
        };
        for (const setting of settings.results || []) {
            try {
                taxSettings[setting.key] = JSON.parse(setting.value);
            }
            catch (parseError) {
                console.warn(`Failed to parse tax setting ${setting.key}:`, parseError);
            }
        }
        return taxSettings;
    }
    catch (error) {
        console.error('Get tax settings error:', error);
        return {
            enabled: false,
            rate: 0.1,
            method: 'exclusive',
            exemptProducts: [],
        };
    }
};
export const isProductTaxExempt = async (c, productId) => {
    try {
        const taxSettings = await getTaxSettings(c);
        if (!taxSettings.exemptProducts || !Array.isArray(taxSettings.exemptProducts)) {
            return false;
        }
        // Check if product is in exempt list
        return taxSettings.exemptProducts.includes(productId);
    }
    catch (error) {
        console.error('Check tax exempt error:', error);
        return false;
    }
};
export const calculateItemTax = (item, taxSettings) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = item.discountAmount || 0;
    const taxableAmount = itemTotal - itemDiscount;
    let taxAmount = 0;
    if (taxSettings.enabled && !item.taxExempt) {
        if (taxSettings.method === 'inclusive') {
            taxAmount = taxableAmount * (taxSettings.rate / (1 + taxSettings.rate));
        }
        else {
            taxAmount = taxableAmount * taxSettings.rate;
        }
    }
    return {
        taxableAmount,
        taxAmount: Math.round(taxAmount),
        totalWithTax: Math.round(taxableAmount + (taxSettings.method === 'exclusive' ? taxAmount : 0)),
    };
};
export const generateTaxReport = async (c, startDate, endDate) => {
    try {
        const db = c.env.DB;
        const taxData = await db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(subtotal) as subtotal,
        SUM(tax_amount) as tax_collected,
        SUM(total) as total_sales
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ? 
        AND status = 'completed'
        AND tax_amount > 0
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(startDate, endDate).all();
        const summary = await db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(subtotal) as total_subtotal,
        SUM(tax_amount) as total_tax_collected,
        SUM(total) as total_sales
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ? 
        AND status = 'completed'
        AND tax_amount > 0
    `).bind(startDate, endDate).first();
        return {
            period: { startDate, endDate },
            dailyData: taxData.results || [],
            summary: summary || {
                total_orders: 0,
                total_subtotal: 0,
                total_tax_collected: 0,
                total_sales: 0,
            },
        };
    }
    catch (error) {
        console.error('Generate tax report error:', error);
        throw error;
    }
};

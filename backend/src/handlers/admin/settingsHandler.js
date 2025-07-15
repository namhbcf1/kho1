export const settingsHandler = {
    async getSettings(c) {
        try {
            const db = c.env.DB;
            const settings = await db.prepare(`
        SELECT key, value, category 
        FROM settings 
        WHERE 1=1
      `).all();
            const settingsMap = settings.results?.reduce((acc, setting) => {
                if (!acc[setting.category]) {
                    acc[setting.category] = {};
                }
                acc[setting.category][setting.key] = JSON.parse(setting.value);
                return acc;
            }, {}) || {};
            return c.json({
                success: true,
                data: { settings: settingsMap },
            });
        }
        catch (error) {
            console.error('Get settings error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'SETTINGS_ERROR',
                    message: 'Failed to fetch settings',
                },
            }, 500);
        }
    },
    async updateBusinessSettings(c) {
        try {
            const db = c.env.DB;
            const businessData = await c.req.json();
            const settingsToUpdate = [
                { key: 'name', value: businessData.name },
                { key: 'address', value: businessData.address },
                { key: 'phone', value: businessData.phone },
                { key: 'email', value: businessData.email },
                { key: 'taxCode', value: businessData.taxCode },
                { key: 'website', value: businessData.website },
                { key: 'logo', value: businessData.logo },
                { key: 'description', value: businessData.description },
            ];
            for (const setting of settingsToUpdate) {
                if (setting.value !== undefined) {
                    await db.prepare(`
            INSERT OR REPLACE INTO settings (key, value, category, updated_at)
            VALUES (?, ?, 'business', datetime('now'))
          `).bind(setting.key, JSON.stringify(setting.value)).run();
                }
            }
            return c.json({
                success: true,
                data: { business: businessData },
            });
        }
        catch (error) {
            console.error('Update business settings error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'SETTINGS_UPDATE_ERROR',
                    message: 'Failed to update business settings',
                },
            }, 500);
        }
    },
    async updateTaxSettings(c) {
        try {
            const db = c.env.DB;
            const taxData = await c.req.json();
            const settingsToUpdate = [
                { key: 'enabled', value: taxData.enabled },
                { key: 'rate', value: taxData.rate },
                { key: 'inclusive', value: taxData.inclusive },
                { key: 'method', value: taxData.method },
                { key: 'taxNumber', value: taxData.taxNumber },
                { key: 'taxOffice', value: taxData.taxOffice },
                { key: 'exemptProducts', value: taxData.exemptProducts },
            ];
            for (const setting of settingsToUpdate) {
                if (setting.value !== undefined) {
                    await db.prepare(`
            INSERT OR REPLACE INTO settings (key, value, category, updated_at)
            VALUES (?, ?, 'tax', datetime('now'))
          `).bind(setting.key, JSON.stringify(setting.value)).run();
                }
            }
            return c.json({
                success: true,
                data: { tax: taxData },
            });
        }
        catch (error) {
            console.error('Update tax settings error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'SETTINGS_UPDATE_ERROR',
                    message: 'Failed to update tax settings',
                },
            }, 500);
        }
    },
    async updatePaymentSettings(c) {
        try {
            const db = c.env.DB;
            const paymentData = await c.req.json();
            const settingsToUpdate = Object.entries(paymentData);
            for (const [key, value] of settingsToUpdate) {
                await db.prepare(`
          INSERT OR REPLACE INTO settings (key, value, category, updated_at)
          VALUES (?, ?, 'payment', datetime('now'))
        `).bind(key, JSON.stringify(value)).run();
            }
            return c.json({
                success: true,
                data: { payment: paymentData },
            });
        }
        catch (error) {
            console.error('Update payment settings error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'SETTINGS_UPDATE_ERROR',
                    message: 'Failed to update payment settings',
                },
            }, 500);
        }
    },
    async updateReceiptSettings(c) {
        try {
            const db = c.env.DB;
            const receiptData = await c.req.json();
            const settingsToUpdate = Object.entries(receiptData);
            for (const [key, value] of settingsToUpdate) {
                await db.prepare(`
          INSERT OR REPLACE INTO settings (key, value, category, updated_at)
          VALUES (?, ?, 'receipt', datetime('now'))
        `).bind(key, JSON.stringify(value)).run();
            }
            return c.json({
                success: true,
                data: { receipt: receiptData },
            });
        }
        catch (error) {
            console.error('Update receipt settings error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'SETTINGS_UPDATE_ERROR',
                    message: 'Failed to update receipt settings',
                },
            }, 500);
        }
    },
    async updateLanguageSettings(c) {
        try {
            const db = c.env.DB;
            const languageData = await c.req.json();
            const settingsToUpdate = Object.entries(languageData);
            for (const [key, value] of settingsToUpdate) {
                await db.prepare(`
          INSERT OR REPLACE INTO settings (key, value, category, updated_at)
          VALUES (?, ?, 'language', datetime('now'))
        `).bind(key, JSON.stringify(value)).run();
            }
            return c.json({
                success: true,
                data: { language: languageData },
            });
        }
        catch (error) {
            console.error('Update language settings error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'SETTINGS_UPDATE_ERROR',
                    message: 'Failed to update language settings',
                },
            }, 500);
        }
    },
    async updateBackupSettings(c) {
        try {
            const db = c.env.DB;
            const backupData = await c.req.json();
            const settingsToUpdate = Object.entries(backupData);
            for (const [key, value] of settingsToUpdate) {
                await db.prepare(`
          INSERT OR REPLACE INTO settings (key, value, category, updated_at)
          VALUES (?, ?, 'backup', datetime('now'))
        `).bind(key, JSON.stringify(value)).run();
            }
            return c.json({
                success: true,
                data: { backup: backupData },
            });
        }
        catch (error) {
            console.error('Update backup settings error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'SETTINGS_UPDATE_ERROR',
                    message: 'Failed to update backup settings',
                },
            }, 500);
        }
    },
};

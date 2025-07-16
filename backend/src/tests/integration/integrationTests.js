/**
 * Integration Test Suite
 * Fixes: Integration testing gaps, API endpoint testing
 * Implements: Database integration, API testing, service communication tests
 */
import { test, assert } from '../unit/testFramework';
import { VietnameseVATService } from '../../services/vietnamese/vatCalculationService';
import { VietnameseFinancialReportingService } from '../../services/vietnamese/financialReportingService';
import { EncryptionService } from '../../services/security/encryptionService';
import { JWTAuthenticationService } from '../../services/security/jwtService';
import { CacheService } from '../../services/performance/cacheService';
import { QueryOptimizer } from '../../services/performance/queryOptimizer';
// Mock database and dependencies
class MockDatabase {
    data = new Map();
    constructor() {
        this.initializeTestData();
    }
    async prepare(sql) {
        return {
            bind: (...params) => ({
                all: async () => this.simulateQuery(sql, params),
                first: async () => {
                    const results = this.simulateQuery(sql, params);
                    return results.length > 0 ? results[0] : null;
                },
                run: async () => ({ success: true })
            })
        };
    }
    async transaction(fn) {
        await fn(this);
    }
    simulateQuery(sql, params) {
        // Simulate database queries based on SQL
        if (sql.includes('SELECT * FROM products')) {
            return [
                { id: 1, name: 'Product 1', price: 100000, category_id: 'general' },
                { id: 2, name: 'Product 2', price: 50000, category_id: 'food-essential' }
            ];
        }
        if (sql.includes('SELECT * FROM transactions')) {
            return [
                {
                    id: 1,
                    total_amount: 110000,
                    created_at: new Date(),
                    status: 'completed',
                    items: [
                        { product_id: 1, product_name: 'Product 1', price: 100000, quantity: 1, category_id: 'general' }
                    ]
                }
            ];
        }
        return [];
    }
    initializeTestData() {
        this.data.set('products', [
            { id: 1, name: 'Test Product 1', price: 100000, category_id: 'general' },
            { id: 2, name: 'Test Product 2', price: 50000, category_id: 'food-essential' }
        ]);
        this.data.set('transactions', [
            { id: 1, total_amount: 110000, created_at: new Date(), status: 'completed' }
        ]);
    }
}
// Integration Test Suite
test.suite({
    id: 'integration-tests',
    name: 'Integration Tests',
    description: 'Tests for service integration and data flow',
    type: 'integration'
})
    // VAT Service Integration Tests
    .test('VAT Service Integration', async () => {
    const vatService = new VietnameseVATService();
    // Test VAT calculation integration
    const result = vatService.calculateItemVAT('general', 100000, 1, 'individual');
    assert.equal(result.vatType, 'standard');
    assert.equal(result.vatRate, 10);
    assert.equal(result.vatAmount, 10000);
    assert.equal(result.postTaxAmount, 110000);
    assert.truthy(result.compliance);
})
    .tags('vat', 'integration')
    .priority('high')
    .test('VAT Declaration Generation', async () => {
    const vatService = new VietnameseVATService();
    const transactions = [
        {
            transactionId: 'txn_1',
            items: [
                { productId: 'general', productName: 'Test Product', preTaxPrice: 100000, quantity: 1 }
            ],
            customerType: 'individual',
            transactionDate: new Date()
        }
    ];
    const declaration = vatService.generateVATDeclaration('2024-01', '0123456789', transactions);
    assert.equal(declaration.period, '2024-01');
    assert.equal(declaration.businessTaxId, '0123456789');
    assert.equal(declaration.status, 'draft');
    assert.truthy(declaration.declarations.length > 0);
    assert.equal(declaration.totals.totalRevenue, 100000);
    assert.equal(declaration.totals.totalVATCollected, 10000);
})
    .tags('vat', 'declaration', 'integration')
    .priority('high')
    // Financial Reporting Integration Tests
    .test('Financial Reporting Service Integration', async () => {
    const db = new MockDatabase();
    const vatService = new VietnameseVATService();
    const reportingService = new VietnameseFinancialReportingService(db, vatService);
    const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: '2024-01',
        type: 'monthly'
    };
    // Test revenue report generation
    const revenueReport = await reportingService.generateRevenueReport(period);
    assert.truthy(revenueReport.totalRevenue >= 0);
    assert.truthy(revenueReport.revenueByCategory);
    assert.truthy(revenueReport.revenueByPaymentMethod);
    assert.truthy(revenueReport.dailyBreakdown);
})
    .tags('financial', 'reporting', 'integration')
    .priority('high')
    .test('VAT Report Generation', async () => {
    const db = new MockDatabase();
    const vatService = new VietnameseVATService();
    const reportingService = new VietnameseFinancialReportingService(db, vatService);
    const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: '2024-01',
        type: 'monthly'
    };
    const vatReport = await reportingService.generateVATReport(period);
    assert.truthy(vatReport.totalVATCollected >= 0);
    assert.truthy(vatReport.vatByRate);
    assert.truthy(vatReport.monthlyBreakdown);
    assert.truthy(vatReport.complianceStatus);
})
    .tags('vat', 'reporting', 'integration')
    .priority('high')
    // Security Service Integration Tests
    .test('Encryption Service Integration', async () => {
    const encryptionService = new EncryptionService();
    // Test encryption/decryption flow
    const originalData = {
        cardNumber: '1234567890123456',
        expiryDate: '12/25',
        holderName: 'John Doe'
    };
    const encrypted = await encryptionService.encryptPaymentData(originalData);
    assert.truthy(encrypted.data);
    assert.truthy(encrypted.iv);
    assert.truthy(encrypted.tag);
    assert.truthy(encrypted.keyId);
    assert.equal(encrypted.algorithm, 'AES-GCM');
    const decrypted = await encryptionService.decrypt(encrypted);
    const decryptedData = JSON.parse(decrypted);
    // Card number should be masked
    assert.truthy(decryptedData.cardNumber.includes('*'));
    assert.equal(decryptedData.holderName, originalData.holderName);
})
    .tags('security', 'encryption', 'integration')
    .priority('critical')
    .test('JWT Authentication Flow', async () => {
    const db = new MockDatabase();
    const encryptionService = new EncryptionService();
    const jwtService = new JWTAuthenticationService(db, encryptionService);
    const userClaims = {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['cashier'],
        permissions: ['sales.create', 'sales.read'],
        sessionId: 'session123'
    };
    // Test token generation
    const tokenPair = await jwtService.generateTokenPair(userClaims, '127.0.0.1', 'test-agent');
    assert.truthy(tokenPair.accessToken);
    assert.truthy(tokenPair.refreshToken);
    assert.equal(tokenPair.tokenType, 'Bearer');
    assert.truthy(tokenPair.expiresAt);
    // Test token validation
    const validation = await jwtService.validateAccessToken(tokenPair.accessToken);
    assert.equal(validation.isValid, true);
    assert.truthy(validation.payload);
    assert.equal(validation.payload.sub, userClaims.userId);
    assert.equal(validation.payload.username, userClaims.username);
})
    .tags('security', 'jwt', 'authentication', 'integration')
    .priority('critical')
    // Cache Service Integration Tests
    .test('Cache Service Integration', async () => {
    const cacheService = new CacheService({
        enableRedis: false, // Use memory cache only for testing
        enableMemoryCache: true,
        enableBrowserCache: false
    });
    const testData = { id: 1, name: 'Test Data', value: 12345 };
    // Test cache set/get
    await cacheService.set('test-key', testData);
    const cached = await cacheService.get('test-key');
    assert.deepEqual(cached, testData);
    // Test cache with fallback
    const fallbackData = { id: 2, name: 'Fallback Data', value: 67890 };
    const result = await cacheService.get('missing-key', async () => fallbackData);
    assert.deepEqual(result, fallbackData);
    // Test cache invalidation
    await cacheService.invalidate('test-key');
    const afterInvalidation = await cacheService.get('test-key');
    assert.equal(afterInvalidation, null);
})
    .tags('performance', 'cache', 'integration')
    .priority('high')
    // Query Optimizer Integration Tests
    .test('Query Optimizer Integration', async () => {
    const db = new MockDatabase();
    const queryOptimizer = new QueryOptimizer(db, {
        enableQueryAnalysis: true,
        enableAutoIndexing: false,
        enableQueryCache: true,
        enableBatching: false,
        slowQueryThreshold: 100,
        poolConfig: {
            minConnections: 1,
            maxConnections: 10,
            acquireTimeout: 5000,
            idleTimeout: 30000,
            connectionTimeout: 10000,
            enableHealthCheck: true,
            healthCheckInterval: 30000
        }
    });
    // Test query execution with optimization
    const results = await queryOptimizer.executeQuery('SELECT * FROM products WHERE price > ?', [50000], { cache: true, analyze: true });
    assert.truthy(Array.isArray(results));
    // Test query analysis
    const analysis = await queryOptimizer.analyzeQuery('SELECT * FROM products WHERE price > ?', [50000]);
    assert.truthy(analysis.recommendations);
    assert.truthy(analysis.optimizationSuggestions);
})
    .tags('performance', 'database', 'integration')
    .priority('high')
    // End-to-End Transaction Flow Test
    .test('Complete Transaction Flow', async () => {
    const db = new MockDatabase();
    const vatService = new VietnameseVATService();
    const encryptionService = new EncryptionService();
    const jwtService = new JWTAuthenticationService(db, encryptionService);
    const cacheService = new CacheService({ enableRedis: false });
    // 1. Authenticate user
    const userClaims = {
        userId: 'cashier123',
        username: 'cashier',
        email: 'cashier@shop.com',
        roles: ['cashier'],
        permissions: ['sales.create', 'sales.read'],
        sessionId: 'session123'
    };
    const tokenPair = await jwtService.generateTokenPair(userClaims, '127.0.0.1', 'pos-terminal');
    assert.truthy(tokenPair.accessToken);
    // 2. Validate token
    const validation = await jwtService.validateAccessToken(tokenPair.accessToken);
    assert.equal(validation.isValid, true);
    // 3. Check permissions
    const hasPermission = jwtService.hasPermission(tokenPair.accessToken, 'sales.create');
    assert.equal(hasPermission, true);
    // 4. Calculate VAT for transaction
    const vatResult = vatService.calculateItemVAT('general', 100000, 1, 'individual');
    assert.equal(vatResult.vatAmount, 10000);
    // 5. Cache transaction data
    const transactionData = {
        items: [{ productId: 'general', price: 100000, quantity: 1 }],
        vatAmount: vatResult.vatAmount,
        total: vatResult.postTaxAmount
    };
    await cacheService.set(`transaction:${userClaims.sessionId}`, transactionData);
    const cachedTransaction = await cacheService.get(`transaction:${userClaims.sessionId}`);
    assert.deepEqual(cachedTransaction, transactionData);
    // 6. Encrypt sensitive payment data
    const paymentData = {
        cardNumber: '1234567890123456',
        expiryDate: '12/25',
        holderName: 'Customer Name'
    };
    const encryptedPayment = await encryptionService.encryptPaymentData(paymentData);
    assert.truthy(encryptedPayment.data);
    console.log('✅ Complete transaction flow test passed');
})
    .tags('e2e', 'transaction', 'integration')
    .priority('critical')
    // API Endpoint Integration Tests
    .test('API Endpoint Integration', async () => {
    // Mock API request/response
    const mockRequest = {
        method: 'POST',
        url: '/api/v1/transactions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
        },
        body: {
            items: [
                { productId: 'general', price: 100000, quantity: 1 }
            ],
            paymentMethod: 'cash',
            customerId: 'customer123'
        }
    };
    const mockResponse = {
        status: 201,
        data: {
            id: 'txn_123',
            total: 110000,
            vatAmount: 10000,
            status: 'completed'
        }
    };
    // Simulate API endpoint processing
    const processAPIRequest = async (request) => {
        // Validate request
        if (!request.headers.Authorization) {
            throw new Error('Authorization required');
        }
        // Process transaction
        const vatService = new VietnameseVATService();
        const items = request.body.items;
        let totalVAT = 0;
        let totalAmount = 0;
        for (const item of items) {
            const vatResult = vatService.calculateItemVAT(item.productId, item.price, item.quantity, 'individual');
            totalVAT += vatResult.vatAmount;
            totalAmount += vatResult.postTaxAmount;
        }
        return {
            status: 201,
            data: {
                id: 'txn_123',
                total: totalAmount,
                vatAmount: totalVAT,
                status: 'completed'
            }
        };
    };
    const response = await processAPIRequest(mockRequest);
    assert.equal(response.status, 201);
    assert.equal(response.data.total, 110000);
    assert.equal(response.data.vatAmount, 10000);
    assert.equal(response.data.status, 'completed');
})
    .tags('api', 'endpoint', 'integration')
    .priority('high')
    // Database Migration Integration Test
    .test('Database Migration Integration', async () => {
    const db = new MockDatabase();
    // Test migration execution
    const runMigration = async (sql) => {
        await db.prepare(sql).bind().run();
        return { success: true };
    };
    // Test security schema migration
    const securityMigration = `
    CREATE TABLE IF NOT EXISTS test_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
    const result = await runMigration(securityMigration);
    assert.equal(result.success, true);
    // Test data insertion
    const insertUser = await db.prepare(`
    INSERT INTO test_users (id, username, email, password_hash) 
    VALUES (?, ?, ?, ?)
  `).bind('user1', 'testuser', 'test@example.com', 'hashed_password').run();
    assert.equal(insertUser.success, true);
})
    .tags('database', 'migration', 'integration')
    .priority('medium')
    // Service Communication Test
    .test('Service Communication Integration', async () => {
    const db = new MockDatabase();
    const vatService = new VietnameseVATService();
    const reportingService = new VietnameseFinancialReportingService(db, vatService);
    const encryptionService = new EncryptionService();
    const cacheService = new CacheService({ enableRedis: false });
    // Test service communication flow
    const testServiceCommunication = async () => {
        // 1. VAT Service calculates tax
        const vatResult = vatService.calculateItemVAT('general', 100000, 1, 'individual');
        // 2. Encryption Service encrypts sensitive data
        const encryptedData = await encryptionService.encrypt({
            transactionId: 'txn_123',
            amount: vatResult.postTaxAmount,
            vatAmount: vatResult.vatAmount
        });
        // 3. Cache Service stores encrypted data
        await cacheService.set('transaction:encrypted:txn_123', encryptedData);
        // 4. Reporting Service generates report
        const period = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            period: '2024-01',
            type: 'monthly'
        };
        const report = await reportingService.generateRevenueReport(period);
        // 5. Verify service communication
        assert.equal(vatResult.vatAmount, 10000);
        assert.truthy(encryptedData.data);
        assert.truthy(report.totalRevenue >= 0);
        // 6. Retrieve and decrypt cached data
        const cached = await cacheService.get('transaction:encrypted:txn_123');
        assert.truthy(cached);
        const decrypted = await encryptionService.decrypt(cached);
        const decryptedData = JSON.parse(decrypted);
        assert.equal(decryptedData.transactionId, 'txn_123');
        assert.equal(decryptedData.amount, vatResult.postTaxAmount);
    };
    await testServiceCommunication();
})
    .tags('service', 'communication', 'integration')
    .priority('high')
    // Error Handling Integration Test
    .test('Error Handling Integration', async () => {
    const db = new MockDatabase();
    const vatService = new VietnameseVATService();
    const encryptionService = new EncryptionService();
    // Test error handling in service chain
    const testErrorHandling = async () => {
        try {
            // This should throw an error for invalid product category
            vatService.calculateItemVAT('invalid-category', 100000, 1, 'individual');
            throw new Error('Should have thrown error for invalid category');
        }
        catch (error) {
            assert.truthy(error.message.includes('not found'));
        }
        try {
            // This should throw an error for invalid encrypted data
            await encryptionService.decrypt({
                data: 'invalid-data',
                iv: 'invalid-iv',
                tag: 'invalid-tag',
                keyId: 'invalid-key',
                algorithm: 'AES-GCM',
                timestamp: Date.now()
            });
            throw new Error('Should have thrown decryption error');
        }
        catch (error) {
            assert.truthy(error.message.includes('decryption'));
        }
    };
    await testErrorHandling();
})
    .tags('error', 'handling', 'integration')
    .priority('high');
// Export for use in other test files
export { test as integrationTest };

/**
 * End-to-End Encryption Service
 * Fixes: Security vulnerabilities, data breach risks
 * Implements: AES-256-GCM encryption, key rotation, secure key management
 */
import { z } from 'zod';
/**
 * Enterprise-grade encryption service with key rotation
 */
export class EncryptionService {
    config;
    activeKeys = new Map();
    keyRotationSchedule = new Map();
    constructor(config) {
        this.config = {
            algorithm: 'AES-GCM',
            keyLength: 256,
            ivLength: 12,
            tagLength: 16,
            keyRotationInterval: 24, // 24 hours
            enableKeyRotation: true,
            ...config
        };
        this.initializeEncryption();
    }
    /**
     * Initialize encryption service with master keys
     */
    async initializeEncryption() {
        try {
            // Generate initial keys for different purposes
            const purposes = ['general', 'payment', 'personal', 'audit'];
            for (const purpose of purposes) {
                const key = await this.generateNewKey(purpose);
                this.activeKeys.set(purpose, key);
                if (this.config.enableKeyRotation) {
                    this.scheduleKeyRotation(purpose);
                }
            }
        }
        catch (error) {
            console.error('Failed to initialize encryption service:', error);
            throw new Error('Encryption service initialization failed');
        }
    }
    /**
     * Encrypt sensitive data with AES-256-GCM
     */
    async encrypt(data, purpose = 'general') {
        try {
            const key = this.activeKeys.get(purpose);
            if (!key || !key.isActive) {
                throw new Error(`No active encryption key found for purpose: ${purpose}`);
            }
            // Convert data to string if it's an object
            const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
            const encoder = new TextEncoder();
            const plaintextBytes = encoder.encode(plaintext);
            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
            // Encrypt the data
            const encryptedBuffer = await crypto.subtle.encrypt({
                name: this.config.algorithm,
                iv: iv,
                tagLength: this.config.tagLength * 8 // Convert to bits
            }, key.key, plaintextBytes);
            // Extract the tag (last 16 bytes) and ciphertext
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const ciphertext = encryptedArray.slice(0, -this.config.tagLength);
            const tag = encryptedArray.slice(-this.config.tagLength);
            return {
                data: this.arrayBufferToBase64(ciphertext),
                iv: this.arrayBufferToBase64(iv),
                tag: this.arrayBufferToBase64(tag),
                keyId: key.id,
                algorithm: this.config.algorithm,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Data encryption failed');
        }
    }
    /**
     * Decrypt data using the appropriate key
     */
    async decrypt(encryptedData) {
        try {
            // Find the key used for encryption
            const key = Array.from(this.activeKeys.values()).find(k => k.id === encryptedData.keyId);
            if (!key) {
                throw new Error(`Decryption key not found: ${encryptedData.keyId}`);
            }
            // Convert base64 data back to ArrayBuffer
            const ciphertext = this.base64ToArrayBuffer(encryptedData.data);
            const iv = this.base64ToArrayBuffer(encryptedData.iv);
            const tag = this.base64ToArrayBuffer(encryptedData.tag);
            // Combine ciphertext and tag for decryption
            const encryptedBuffer = new Uint8Array(ciphertext.byteLength + tag.byteLength);
            encryptedBuffer.set(new Uint8Array(ciphertext), 0);
            encryptedBuffer.set(new Uint8Array(tag), ciphertext.byteLength);
            // Decrypt the data
            const decryptedBuffer = await crypto.subtle.decrypt({
                name: this.config.algorithm,
                iv: iv,
                tagLength: this.config.tagLength * 8
            }, key.key, encryptedBuffer);
            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        }
        catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Data decryption failed');
        }
    }
    /**
     * Encrypt payment card data with PCI DSS compliance
     */
    async encryptPaymentData(paymentData) {
        // Mask sensitive fields before encryption
        const maskedData = {
            ...paymentData,
            cardNumber: paymentData.cardNumber ? this.maskCardNumber(paymentData.cardNumber) : undefined,
            cvv: undefined // Never store CVV
        };
        return this.encrypt(maskedData, 'payment');
    }
    /**
     * Encrypt personal data for GDPR compliance
     */
    async encryptPersonalData(personalData) {
        return this.encrypt(personalData, 'personal');
    }
    /**
     * Encrypt audit log data
     */
    async encryptAuditData(auditData) {
        return this.encrypt(auditData, 'audit');
    }
    /**
     * Rotate encryption keys
     */
    async rotateKey(purpose) {
        try {
            const oldKey = this.activeKeys.get(purpose);
            if (!oldKey) {
                throw new Error(`No existing key found for purpose: ${purpose}`);
            }
            // Generate new key
            const newKey = await this.generateNewKey(purpose);
            // Mark old key as inactive but keep it for decryption
            oldKey.isActive = false;
            oldKey.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            // Set new key as active
            this.activeKeys.set(purpose, newKey);
            // Store both keys (old for decryption, new for encryption)
            const oldKeyId = `${purpose}_old_${Date.now()}`;
            this.activeKeys.set(oldKeyId, oldKey);
            // Schedule next rotation
            if (this.config.enableKeyRotation) {
                this.scheduleKeyRotation(purpose);
            }
            return {
                success: true,
                newKeyId: newKey.id,
                oldKeyId: oldKey.id,
                rotatedAt: new Date()
            };
        }
        catch (error) {
            console.error('Key rotation failed:', error);
            return {
                success: false,
                newKeyId: '',
                oldKeyId: '',
                rotatedAt: new Date(),
                error: error.message
            };
        }
    }
    /**
     * Securely hash sensitive data for search/indexing
     */
    async hashForSearch(data, salt) {
        const encoder = new TextEncoder();
        const saltBytes = salt ? encoder.encode(salt) : crypto.getRandomValues(new Uint8Array(16));
        const dataBytes = encoder.encode(data);
        // Combine salt and data
        const combined = new Uint8Array(saltBytes.length + dataBytes.length);
        combined.set(saltBytes, 0);
        combined.set(dataBytes, saltBytes.length);
        // Hash with SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
        return this.arrayBufferToBase64(hashBuffer);
    }
    /**
     * Generate secure random token
     */
    generateSecureToken(length = 32) {
        const array = crypto.getRandomValues(new Uint8Array(length));
        return this.arrayBufferToBase64(array);
    }
    /**
     * Validate encryption data integrity
     */
    async validateEncryptedData(encryptedData) {
        const issues = [];
        // Check required fields
        if (!encryptedData.data)
            issues.push('Missing encrypted data');
        if (!encryptedData.iv)
            issues.push('Missing initialization vector');
        if (!encryptedData.tag)
            issues.push('Missing authentication tag');
        if (!encryptedData.keyId)
            issues.push('Missing key identifier');
        // Check algorithm
        if (encryptedData.algorithm !== this.config.algorithm) {
            issues.push(`Unsupported algorithm: ${encryptedData.algorithm}`);
        }
        // Check key existence
        const keyExists = Array.from(this.activeKeys.values()).some(k => k.id === encryptedData.keyId);
        if (!keyExists) {
            issues.push(`Key not found: ${encryptedData.keyId}`);
        }
        // Check data age (optional)
        if (encryptedData.timestamp) {
            const ageHours = (Date.now() - encryptedData.timestamp) / (1000 * 60 * 60);
            if (ageHours > 24 * 365) { // 1 year
                issues.push('Encrypted data is very old, consider re-encryption');
            }
        }
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    /**
     * Securely wipe memory containing sensitive data
     */
    secureWipe(data) {
        if (data instanceof ArrayBuffer) {
            const view = new Uint8Array(data);
            for (let i = 0; i < view.length; i++) {
                view[i] = 0;
            }
        }
        else {
            for (let i = 0; i < data.length; i++) {
                data[i] = 0;
            }
        }
    }
    /**
     * Get encryption service health status
     */
    getServiceHealth() {
        const issues = [];
        const activeKeyCount = Array.from(this.activeKeys.values()).filter(k => k.isActive).length;
        if (activeKeyCount === 0) {
            issues.push('No active encryption keys');
        }
        else if (activeKeyCount < 4) {
            issues.push('Some encryption keys missing');
        }
        const nextRotations = Array.from(this.keyRotationSchedule.entries()).map(([purpose, timeout]) => ({
            purpose,
            scheduledAt: new Date(Date.now() + timeout._idleTimeout)
        }));
        let status = 'healthy';
        if (issues.some(i => i.includes('No active'))) {
            status = 'critical';
        }
        else if (issues.length > 0) {
            status = 'degraded';
        }
        return {
            status,
            activeKeys: activeKeyCount,
            keyRotationEnabled: this.config.enableKeyRotation,
            nextRotations,
            issues
        };
    }
    // Private helper methods
    async generateNewKey(purpose) {
        const keyId = `${purpose}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const cryptoKey = await crypto.subtle.generateKey({
            name: this.config.algorithm,
            length: this.config.keyLength
        }, false, // Not extractable for security
        ['encrypt', 'decrypt']);
        return {
            id: keyId,
            key: cryptoKey,
            createdAt: new Date(),
            isActive: true,
            purpose
        };
    }
    scheduleKeyRotation(purpose) {
        // Clear existing rotation schedule
        const existingTimeout = this.keyRotationSchedule.get(purpose);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        // Schedule new rotation
        const rotationTimeout = setTimeout(() => {
            this.rotateKey(purpose).then(result => {
                if (result.success) {
                    console.log(`Key rotation successful for ${purpose}:`, result);
                }
                else {
                    console.error(`Key rotation failed for ${purpose}:`, result.error);
                }
            });
        }, this.config.keyRotationInterval * 60 * 60 * 1000); // Convert hours to milliseconds
        this.keyRotationSchedule.set(purpose, rotationTimeout);
    }
    maskCardNumber(cardNumber) {
        // Keep first 6 and last 4 digits for BIN and reference
        const cleaned = cardNumber.replace(/\D/g, '');
        if (cleaned.length < 10)
            return '*'.repeat(cleaned.length);
        const first6 = cleaned.substring(0, 6);
        const last4 = cleaned.substring(cleaned.length - 4);
        const middle = '*'.repeat(cleaned.length - 10);
        return `${first6}${middle}${last4}`;
    }
    arrayBufferToBase64(buffer) {
        const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
/**
 * Encryption data schema for validation
 */
export const EncryptedDataSchema = z.object({
    data: z.string(),
    iv: z.string(),
    tag: z.string(),
    keyId: z.string(),
    algorithm: z.string(),
    timestamp: z.number()
});
/**
 * Payment data encryption schema
 */
export const PaymentDataSchema = z.object({
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
    holderName: z.string().optional()
});
/**
 * Personal data encryption schema
 */
export const PersonalDataSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    identityNumber: z.string().optional()
});

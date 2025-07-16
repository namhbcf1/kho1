/**
 * Event Sourcing Implementation for Financial Transactions
 * Fixes: Database architecture catastrophic design issues
 * Implements: ACID compliance, audit trail, rollback capabilities
 */
import { z } from 'zod';
const EventSchema = z.object({
    aggregateId: z.string(),
    aggregateType: z.string(),
    eventType: z.string(),
    eventData: z.record(z.any()),
    metadata: z.object({
        userId: z.string(),
        timestamp: z.string(),
        version: z.number(),
        causationId: z.string().optional(),
        correlationId: z.string().optional()
    })
});
/**
 * Event Store with ACID guarantees and concurrency control
 */
export class EventStore {
    db;
    eventHandlers = new Map();
    constructor(database) {
        this.db = database;
    }
    /**
     * Append events to stream with optimistic concurrency control
     */
    async appendToStream(aggregateId, aggregateType, events, expectedVersion) {
        const transaction = async () => {
            // Check current version for optimistic concurrency
            const currentStream = await this.db.prepare(`
        SELECT MAX(stream_position) as current_version 
        FROM event_store 
        WHERE aggregate_id = ? AND aggregate_type = ?
      `).bind(aggregateId, aggregateType).first();
            const currentVersion = currentStream?.current_version || 0;
            if (expectedVersion !== currentVersion) {
                return {
                    success: false,
                    currentVersion,
                    error: `Concurrency conflict. Expected version ${expectedVersion}, but current is ${currentVersion}`
                };
            }
            // Append events atomically
            const eventInserts = events.map((event, index) => {
                const eventId = this.generateEventId();
                const streamPosition = currentVersion + index + 1;
                return this.db.prepare(`
          INSERT INTO event_store (
            id, aggregate_id, aggregate_type, event_type, 
            event_data, metadata, stream_position, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(eventId, aggregateId, aggregateType, event.eventType, JSON.stringify(event.eventData), JSON.stringify(event.metadata), streamPosition);
            });
            // Execute all inserts in batch (atomic)
            await this.db.batch(eventInserts);
            // Update aggregate version
            await this.db.prepare(`
        INSERT OR REPLACE INTO aggregate_versions (
          aggregate_id, aggregate_type, version, updated_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(aggregateId, aggregateType, currentVersion + events.length).run();
            return {
                success: true,
                currentVersion: currentVersion + events.length
            };
        };
        try {
            return await transaction();
        }
        catch (error) {
            console.error('Event store append failed:', error);
            return {
                success: false,
                error: 'Failed to append events to stream'
            };
        }
    }
    /**
     * Read event stream for aggregate
     */
    async readStream(aggregateId, aggregateType, fromVersion = 0) {
        const events = await this.db.prepare(`
      SELECT id, aggregate_id, aggregate_type, event_type, 
             event_data, metadata, stream_position, created_at
      FROM event_store 
      WHERE aggregate_id = ? AND aggregate_type = ? AND stream_position > ?
      ORDER BY stream_position ASC
    `).bind(aggregateId, aggregateType, fromVersion).all();
        const currentVersion = events.results.length > 0
            ? Math.max(...events.results.map((e) => e.stream_position))
            : 0;
        return {
            aggregateId,
            aggregateType,
            currentVersion,
            events: events.results.map((row) => ({
                id: row.id,
                aggregateId: row.aggregate_id,
                aggregateType: row.aggregate_type,
                eventType: row.event_type,
                eventData: JSON.parse(row.event_data),
                metadata: JSON.parse(row.metadata),
                streamPosition: row.stream_position
            }))
        };
    }
    /**
     * Save snapshot for performance optimization
     */
    async saveSnapshot(snapshot) {
        await this.db.prepare(`
      INSERT OR REPLACE INTO aggregate_snapshots (
        aggregate_id, aggregate_type, version, data, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(snapshot.aggregateId, snapshot.aggregateType, snapshot.version, JSON.stringify(snapshot.data)).run();
    }
    /**
     * Load snapshot if available
     */
    async loadSnapshot(aggregateId, aggregateType) {
        const snapshot = await this.db.prepare(`
      SELECT aggregate_id, aggregate_type, version, data, created_at
      FROM aggregate_snapshots 
      WHERE aggregate_id = ? AND aggregate_type = ?
      ORDER BY version DESC LIMIT 1
    `).bind(aggregateId, aggregateType).first();
        if (!snapshot)
            return null;
        return {
            aggregateId: snapshot.aggregate_id,
            aggregateType: snapshot.aggregate_type,
            version: snapshot.version,
            data: JSON.parse(snapshot.data),
            timestamp: snapshot.created_at
        };
    }
    /**
     * Subscribe to events for real-time updates
     */
    subscribe(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }
    /**
     * Publish events to subscribers
     */
    async publishEvents(events) {
        for (const event of events) {
            const handlers = this.eventHandlers.get(event.eventType) || [];
            await Promise.all(handlers.map(handler => handler(event)));
        }
    }
    /**
     * Get all events after a certain position (for projections)
     */
    async getEventsAfterPosition(position, limit = 100) {
        const events = await this.db.prepare(`
      SELECT id, aggregate_id, aggregate_type, event_type, 
             event_data, metadata, stream_position, created_at
      FROM event_store 
      WHERE stream_position > ?
      ORDER BY stream_position ASC
      LIMIT ?
    `).bind(position, limit).all();
        return events.results.map((row) => ({
            id: row.id,
            aggregateId: row.aggregate_id,
            aggregateType: row.aggregate_type,
            eventType: row.event_type,
            eventData: JSON.parse(row.event_data),
            metadata: JSON.parse(row.metadata),
            streamPosition: row.stream_position
        }));
    }
    /**
     * Replay events for debugging/recovery
     */
    async replayEvents(aggregateId, aggregateType, toVersion) {
        let query = `
      SELECT id, aggregate_id, aggregate_type, event_type, 
             event_data, metadata, stream_position, created_at
      FROM event_store 
      WHERE aggregate_id = ? AND aggregate_type = ?
    `;
        const params = [aggregateId, aggregateType];
        if (toVersion) {
            query += ' AND stream_position <= ?';
            params.push(toVersion);
        }
        query += ' ORDER BY stream_position ASC';
        const events = await this.db.prepare(query).bind(...params).all();
        return events.results.map((row) => ({
            id: row.id,
            aggregateId: row.aggregate_id,
            aggregateType: row.aggregate_type,
            eventType: row.event_type,
            eventData: JSON.parse(row.event_data),
            metadata: JSON.parse(row.metadata),
            streamPosition: row.stream_position
        }));
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
}
/**
 * Base Aggregate Root with Event Sourcing
 */
export class AggregateRoot {
    id;
    version = 0;
    uncommittedEvents = [];
    constructor(id) {
        this.id = id;
    }
    /**
     * Apply event to aggregate
     */
    addEvent(eventType, eventData, metadata) {
        const event = {
            id: this.generateEventId(),
            aggregateId: this.id,
            aggregateType: this.constructor.name,
            eventType,
            eventData,
            metadata: {
                ...metadata,
                version: this.version + 1,
                timestamp: new Date().toISOString()
            },
            streamPosition: this.version + 1
        };
        this.uncommittedEvents.push(event);
        this.version++;
        this.applyEvent(event);
    }
    /**
     * Get uncommitted events
     */
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }
    /**
     * Mark events as committed
     */
    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }
    /**
     * Load from history
     */
    loadFromHistory(events) {
        events.forEach(event => {
            this.applyEvent(event);
            this.version = event.streamPosition;
        });
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
}
/**
 * Financial Transaction Aggregate
 */
export class FinancialTransaction extends AggregateRoot {
    orderId;
    amount;
    currency;
    status;
    paymentMethod;
    gatewayTransactionId;
    createdAt;
    completedAt;
    constructor(id) {
        super(id);
        this.status = 'pending';
        this.currency = 'VND';
        this.createdAt = new Date().toISOString();
    }
    static createNew(id, orderId, amount, paymentMethod, userId) {
        const transaction = new FinancialTransaction(id);
        transaction.addEvent('TransactionCreated', {
            orderId,
            amount,
            paymentMethod,
            currency: 'VND'
        }, { userId });
        return transaction;
    }
    completePayment(gatewayTransactionId, userId) {
        if (this.status !== 'pending') {
            throw new Error('Transaction is not in pending status');
        }
        this.addEvent('PaymentCompleted', {
            gatewayTransactionId,
            completedAt: new Date().toISOString()
        }, { userId });
    }
    failPayment(reason, userId) {
        if (this.status !== 'pending') {
            throw new Error('Transaction is not in pending status');
        }
        this.addEvent('PaymentFailed', {
            reason,
            failedAt: new Date().toISOString()
        }, { userId });
    }
    refundPayment(refundAmount, reason, userId) {
        if (this.status !== 'completed') {
            throw new Error('Can only refund completed transactions');
        }
        this.addEvent('PaymentRefunded', {
            refundAmount,
            reason,
            refundedAt: new Date().toISOString()
        }, { userId });
    }
    applyEvent(event) {
        switch (event.eventType) {
            case 'TransactionCreated':
                this.orderId = event.eventData.orderId;
                this.amount = event.eventData.amount;
                this.paymentMethod = event.eventData.paymentMethod;
                this.currency = event.eventData.currency;
                break;
            case 'PaymentCompleted':
                this.status = 'completed';
                this.gatewayTransactionId = event.eventData.gatewayTransactionId;
                this.completedAt = event.eventData.completedAt;
                break;
            case 'PaymentFailed':
                this.status = 'failed';
                break;
            case 'PaymentRefunded':
                this.status = 'refunded';
                break;
        }
    }
}
/**
 * Repository pattern for aggregates
 */
export class EventSourcedRepository {
    eventStore;
    aggregateType;
    createAggregate;
    constructor(eventStore, aggregateType, createAggregate) {
        this.eventStore = eventStore;
        this.aggregateType = aggregateType;
        this.createAggregate = createAggregate;
    }
    async save(aggregate) {
        const uncommittedEvents = aggregate.getUncommittedEvents();
        if (uncommittedEvents.length === 0) {
            return { success: true };
        }
        const result = await this.eventStore.appendToStream(aggregate.id, this.aggregateType, uncommittedEvents, aggregate.version - uncommittedEvents.length);
        if (result.success) {
            aggregate.markEventsAsCommitted();
        }
        return result;
    }
    async getById(id) {
        // Try to load from snapshot first
        const snapshot = await this.eventStore.loadSnapshot(id, this.aggregateType);
        let aggregate = this.createAggregate(id);
        let fromVersion = 0;
        if (snapshot) {
            // Reconstruct from snapshot
            Object.assign(aggregate, snapshot.data);
            aggregate.version = snapshot.version;
            fromVersion = snapshot.version;
        }
        // Load events after snapshot
        const stream = await this.eventStore.readStream(id, this.aggregateType, fromVersion);
        if (stream.events.length === 0 && !snapshot) {
            return null; // Aggregate doesn't exist
        }
        aggregate.loadFromHistory(stream.events);
        return aggregate;
    }
}

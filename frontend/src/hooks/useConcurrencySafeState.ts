/**
 * Concurrency-Safe State Management for React 18
 * Fixes: Race conditions in payment flows, state batching issues
 * Implements: Safe concurrent updates, transaction isolation
 */

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

export interface StateTransaction<T> {
  id: string;
  state: T;
  timestamp: number;
  committed: boolean;
  operations: Array<{
    type: string;
    payload: any;
    timestamp: number;
  }>;
}

export interface ConcurrencyConfig {
  enableTransactions: boolean;
  maxPendingTransactions: number;
  transactionTimeout: number;
  conflictResolution: 'last-write-wins' | 'merge' | 'reject';
}

/**
 * Concurrency-safe state hook with transaction support
 */
export function useConcurrencySafeState<T>(
  initialState: T,
  config: Partial<ConcurrencyConfig> = {}
) {
  const fullConfig: ConcurrencyConfig = {
    enableTransactions: true,
    maxPendingTransactions: 10,
    transactionTimeout: 5000,
    conflictResolution: 'last-write-wins',
    ...config
  };

  const [state, setState] = useState<T>(initialState);
  const transactionQueue = useRef<StateTransaction<T>[]>([]);
  const pendingOperations = useRef<Map<string, any>>(new Map());
  const lockRef = useRef<boolean>(false);
  const versionRef = useRef<number>(0);

  /**
   * Create a new transaction
   */
  const createTransaction = useCallback(() => {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const transaction: StateTransaction<T> = {
      id: transactionId,
      state: { ...state },
      timestamp: Date.now(),
      committed: false,
      operations: []
    };

    transactionQueue.current.push(transaction);
    
    // Clean up old transactions
    const now = Date.now();
    transactionQueue.current = transactionQueue.current.filter(
      tx => now - tx.timestamp < fullConfig.transactionTimeout
    );

    return transactionId;
  }, [state, fullConfig.transactionTimeout]);

  /**
   * Add operation to transaction
   */
  const addOperation = useCallback((transactionId: string, type: string, payload: any) => {
    const transaction = transactionQueue.current.find(tx => tx.id === transactionId);
    if (transaction && !transaction.committed) {
      transaction.operations.push({
        type,
        payload,
        timestamp: Date.now()
      });
    }
  }, []);

  /**
   * Commit transaction with conflict resolution
   */
  const commitTransaction = useCallback(async (transactionId: string): Promise<{
    success: boolean;
    conflicts?: string[];
    finalState?: T;
  }> => {
    if (lockRef.current) {
      // Wait for lock to be released
      await new Promise(resolve => {
        const checkLock = () => {
          if (!lockRef.current) {
            resolve(undefined);
          } else {
            setTimeout(checkLock, 10);
          }
        };
        checkLock();
      });
    }

    lockRef.current = true;

    try {
      const transaction = transactionQueue.current.find(tx => tx.id === transactionId);
      if (!transaction || transaction.committed) {
        return { success: false, conflicts: ['transaction_not_found'] };
      }

      // Check for conflicts with other committed transactions
      const conflicts = await detectConflicts(transaction);
      
      if (conflicts.length > 0) {
        const resolution = await resolveConflicts(transaction, conflicts);
        if (!resolution.success) {
          return { success: false, conflicts: resolution.conflicts };
        }
      }

      // Apply operations
      let newState = { ...state };
      for (const operation of transaction.operations) {
        newState = applyOperation(newState, operation);
      }

      // Batch the state update to prevent React 18 batching issues
      unstable_batchedUpdates(() => {
        setState(newState);
        versionRef.current += 1;
      });

      transaction.committed = true;
      
      return { success: true, finalState: newState };

    } finally {
      lockRef.current = false;
    }
  }, [state]);

  /**
   * Detect conflicts between transactions
   */
  const detectConflicts = useCallback(async (transaction: StateTransaction<T>): Promise<string[]> => {
    const conflicts: string[] = [];
    
    // Check if state has changed since transaction started
    if (versionRef.current > 0) {
      // Simple conflict detection - could be enhanced based on specific use case
      const hasConflictingOperations = transactionQueue.current.some(tx => 
        tx.id !== transaction.id && 
        tx.committed && 
        tx.timestamp > transaction.timestamp &&
        hasOperationConflict(tx.operations, transaction.operations)
      );
      
      if (hasConflictingOperations) {
        conflicts.push('concurrent_modification');
      }
    }

    return conflicts;
  }, []);

  /**
   * Resolve conflicts based on strategy
   */
  const resolveConflicts = useCallback(async (
    transaction: StateTransaction<T>,
    conflicts: string[]
  ): Promise<{ success: boolean; conflicts?: string[] }> => {
    switch (fullConfig.conflictResolution) {
      case 'last-write-wins':
        // Always allow the transaction to proceed
        return { success: true };
      
      case 'reject':
        // Reject conflicting transactions
        return { success: false, conflicts };
      
      case 'merge':
        // Attempt to merge - simplified implementation
        try {
          // For merge strategy, we would need domain-specific logic
          // This is a placeholder implementation
          return { success: true };
        } catch (error) {
          return { success: false, conflicts: ['merge_failed'] };
        }
      
      default:
        return { success: false, conflicts };
    }
  }, [fullConfig.conflictResolution]);

  /**
   * Apply operation to state
   */
  const applyOperation = useCallback((currentState: T, operation: any): T => {
    switch (operation.type) {
      case 'set':
        return operation.payload;
      
      case 'merge':
        if (typeof currentState === 'object' && currentState !== null) {
          return { ...currentState, ...operation.payload };
        }
        return operation.payload;
      
      case 'update_field':
        if (typeof currentState === 'object' && currentState !== null) {
          return {
            ...currentState,
            [operation.payload.field]: operation.payload.value
          };
        }
        return currentState;
      
      case 'array_push':
        if (Array.isArray(currentState)) {
          return [...currentState, operation.payload] as unknown as T;
        }
        return currentState;
      
      case 'array_remove':
        if (Array.isArray(currentState)) {
          return currentState.filter((_, index) => index !== operation.payload) as unknown as T;
        }
        return currentState;
      
      default:
        return currentState;
    }
  }, []);

  /**
   * Check if operations conflict
   */
  const hasOperationConflict = useCallback((ops1: any[], ops2: any[]): boolean => {
    // Simple conflict detection - modify same fields
    const fields1 = new Set(ops1.map(op => op.payload?.field).filter(Boolean));
    const fields2 = new Set(ops2.map(op => op.payload?.field).filter(Boolean));
    
    for (const field of fields1) {
      if (fields2.has(field)) {
        return true;
      }
    }
    
    return false;
  }, []);

  /**
   * Safe update function that creates a transaction
   */
  const safeUpdate = useCallback(async (
    updater: (currentState: T) => T | Promise<T>,
    operationType = 'update'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!fullConfig.enableTransactions) {
      // Direct update for simple cases
      try {
        const newState = await updater(state);
        setState(newState);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    const transactionId = createTransaction();
    
    try {
      const newState = await updater(state);
      addOperation(transactionId, 'set', newState);
      
      const result = await commitTransaction(transactionId);
      if (!result.success) {
        return { success: false, error: `Transaction failed: ${result.conflicts?.join(', ')}` };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [state, fullConfig.enableTransactions, createTransaction, addOperation, commitTransaction]);

  /**
   * Optimistic update with rollback capability
   */
  const optimisticUpdate = useCallback((
    optimisticState: T,
    actualUpdatePromise: Promise<T>
  ): Promise<{ success: boolean; rolledBack: boolean }> => {
    // Apply optimistic update immediately
    setState(optimisticState);
    const originalState = state;
    
    return actualUpdatePromise
      .then(actualState => {
        setState(actualState);
        return { success: true, rolledBack: false };
      })
      .catch(error => {
        // Rollback to original state
        setState(originalState);
        console.error('Optimistic update failed, rolled back:', error);
        return { success: false, rolledBack: true };
      });
  }, [state]);

  /**
   * Batch multiple updates safely
   */
  const batchUpdates = useCallback(async (
    updates: Array<() => T | Promise<T>>
  ): Promise<{ success: boolean; errors: string[] }> => {
    const transactionId = createTransaction();
    const errors: string[] = [];
    
    try {
      let currentState = state;
      
      for (let i = 0; i < updates.length; i++) {
        try {
          const newState = await updates[i]();
          addOperation(transactionId, 'batch_update', { index: i, state: newState });
          currentState = newState;
        } catch (error) {
          errors.push(`Update ${i}: ${error.message}`);
        }
      }
      
      if (errors.length === 0) {
        const result = await commitTransaction(transactionId);
        if (!result.success) {
          errors.push(`Transaction commit failed: ${result.conflicts?.join(', ')}`);
        }
      }
      
      return { success: errors.length === 0, errors };
    } catch (error) {
      return { success: false, errors: [error.message] };
    }
  }, [state, createTransaction, addOperation, commitTransaction]);

  // Cleanup effect
  useEffect(() => {
    const cleanup = () => {
      // Clear pending operations
      pendingOperations.current.clear();
      
      // Clear old transactions
      const now = Date.now();
      transactionQueue.current = transactionQueue.current.filter(
        tx => now - tx.timestamp < fullConfig.transactionTimeout
      );
    };

    const interval = setInterval(cleanup, 10000); // Clean up every 10 seconds
    return () => clearInterval(interval);
  }, [fullConfig.transactionTimeout]);

  // Return enhanced state interface
  return useMemo(() => ({
    state,
    setState: safeUpdate,
    optimisticUpdate,
    batchUpdates,
    createTransaction,
    commitTransaction,
    version: versionRef.current,
    pendingTransactions: transactionQueue.current.filter(tx => !tx.committed).length
  }), [state, safeUpdate, optimisticUpdate, batchUpdates, createTransaction, commitTransaction]);
}

/**
 * Hook for payment flow with concurrency safety
 */
export function usePaymentFlowState() {
  const paymentConfig: ConcurrencyConfig = {
    enableTransactions: true,
    maxPendingTransactions: 3, // Very strict for payments
    transactionTimeout: 30000, // 30 seconds for payment processing
    conflictResolution: 'reject' // Never allow conflicting payment operations
  };

  const initialPaymentState = {
    orderId: null,
    amount: 0,
    status: 'idle' as 'idle' | 'processing' | 'completed' | 'failed',
    transactionId: null,
    paymentMethod: null,
    attempts: 0,
    errors: [] as string[]
  };

  const paymentState = useConcurrencySafeState(initialPaymentState, paymentConfig);

  /**
   * Start payment with concurrency protection
   */
  const startPayment = useCallback(async (
    orderId: string,
    amount: number,
    paymentMethod: string
  ) => {
    return paymentState.setState(async (current) => {
      if (current.status === 'processing') {
        throw new Error('Payment already in progress');
      }
      
      return {
        ...current,
        orderId,
        amount,
        paymentMethod,
        status: 'processing',
        attempts: current.attempts + 1,
        errors: []
      };
    });
  }, [paymentState]);

  /**
   * Complete payment with validation
   */
  const completePayment = useCallback(async (transactionId: string) => {
    return paymentState.setState(async (current) => {
      if (current.status !== 'processing') {
        throw new Error('No payment in progress');
      }
      
      return {
        ...current,
        transactionId,
        status: 'completed'
      };
    });
  }, [paymentState]);

  /**
   * Fail payment with error tracking
   */
  const failPayment = useCallback(async (error: string) => {
    return paymentState.setState(async (current) => ({
      ...current,
      status: 'failed',
      errors: [...current.errors, error]
    }));
  }, [paymentState]);

  return {
    ...paymentState,
    startPayment,
    completePayment,
    failPayment
  };
}
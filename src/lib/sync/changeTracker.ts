/**
 * Change Tracker - Hooks into Dexie to track all data changes
 * These changes are queued for sync to the cloud
 */

import { db, logChange, type SyncTable } from '@/db';

let isInitialized = false;
let isTracking = true; // Can be disabled during imports/syncs

/**
 * Enable/disable change tracking
 * Disable during bulk imports or when applying sync changes from server
 */
export function setTrackingEnabled(enabled: boolean): void {
    isTracking = enabled;
}

/**
 * Check if tracking is currently enabled
 */
export function isTrackingEnabled(): boolean {
    return isTracking;
}

/**
 * Initialize change tracking hooks on all tables
 * Should be called once at app startup
 */
export function initializeChangeTracking(): void {
    if (isInitialized) return;

    // Items table hooks
    db.items.hook('creating', function (primKey, obj) {
        if (!isTracking) return;
        // Use setTimeout to avoid blocking the transaction
        setTimeout(() => {
            logChange('items', primKey as string, 'create', obj);
        }, 0);
    });

    db.items.hook('updating', function (modifications, primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('items', primKey as string, 'update', { ...obj, ...modifications });
        }, 0);
    });

    db.items.hook('deleting', function (primKey) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('items', primKey as string, 'delete');
        }, 0);
    });

    // Trips table hooks
    db.trips.hook('creating', function (primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('trips', primKey as string, 'create', obj);
        }, 0);
    });

    db.trips.hook('updating', function (modifications, primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('trips', primKey as string, 'update', { ...obj, ...modifications });
        }, 0);
    });

    db.trips.hook('deleting', function (primKey) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('trips', primKey as string, 'delete');
        }, 0);
    });

    // TripItems table hooks
    db.tripItems.hook('creating', function (primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('tripItems', primKey as string, 'create', obj);
        }, 0);
    });

    db.tripItems.hook('updating', function (modifications, primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('tripItems', primKey as string, 'update', { ...obj, ...modifications });
        }, 0);
    });

    db.tripItems.hook('deleting', function (primKey) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('tripItems', primKey as string, 'delete');
        }, 0);
    });

    // Outfits table hooks
    db.outfits.hook('creating', function (primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('outfits', primKey as string, 'create', obj);
        }, 0);
    });

    db.outfits.hook('updating', function (modifications, primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('outfits', primKey as string, 'update', { ...obj, ...modifications });
        }, 0);
    });

    db.outfits.hook('deleting', function (primKey) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('outfits', primKey as string, 'delete');
        }, 0);
    });

    // Wishlist table hooks
    db.wishlist.hook('creating', function (primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('wishlist', primKey as string, 'create', obj);
        }, 0);
    });

    db.wishlist.hook('updating', function (modifications, primKey, obj) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('wishlist', primKey as string, 'update', { ...obj, ...modifications });
        }, 0);
    });

    db.wishlist.hook('deleting', function (primKey) {
        if (!isTracking) return;
        setTimeout(() => {
            logChange('wishlist', primKey as string, 'delete');
        }, 0);
    });

    isInitialized = true;
    console.log('[ChangeTracker] Initialized - tracking database changes');
}

/**
 * Get the Dexie table instance for a given table name
 */
export function getTableByName(tableName: SyncTable) {
    switch (tableName) {
        case 'items':
            return db.items;
        case 'trips':
            return db.trips;
        case 'tripItems':
            return db.tripItems;
        case 'outfits':
            return db.outfits;
        case 'wishlist':
            return db.wishlist;
        default:
            throw new Error(`Unknown table: ${tableName}`);
    }
}

/**
 * Apply changes from server without triggering change tracking
 * Used during sync pull
 */
export async function applyServerChanges<T extends { id: string }>(
    tableName: SyncTable,
    upserts: T[],
    deletes: string[]
): Promise<{ upserted: number; deleted: number }> {
    const wasTracking = isTracking;
    setTrackingEnabled(false);

    try {
        const table = getTableByName(tableName);
        let upsertedCount = 0;
        let deletedCount = 0;

        // Apply upserts
        for (const record of upserts) {
            await table.put(record as never);
            upsertedCount++;
        }

        // Apply deletes (soft delete by setting _deleted flag)
        for (const id of deletes) {
            const existing = await table.get(id);
            if (existing) {
                await table.update(id, { _deleted: true } as never);
                deletedCount++;
            }
        }

        return { upserted: upsertedCount, deleted: deletedCount };
    } finally {
        setTrackingEnabled(wasTracking);
    }
}

/**
 * Bulk import data without triggering change tracking
 * Used during initial data import or restore
 */
export async function bulkImportWithoutTracking<T>(
    tableName: SyncTable,
    records: T[]
): Promise<number> {
    const wasTracking = isTracking;
    setTrackingEnabled(false);

    try {
        const table = getTableByName(tableName) as any;
        await table.bulkPut(records);
        return records.length;
    } finally {
        setTrackingEnabled(wasTracking);
    }
}

/**
 * Clear all data from a table without triggering change tracking
 */
export async function clearTableWithoutTracking(tableName: SyncTable): Promise<void> {
    const wasTracking = isTracking;
    setTrackingEnabled(false);

    try {
        const table = getTableByName(tableName);
        await table.clear();
    } finally {
        setTrackingEnabled(wasTracking);
    }
}


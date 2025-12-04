/**
 * React Hook for Sync functionality
 * Provides sync state and actions for components
 */

import { useCallback, useEffect, useState } from 'react';
import { getSyncMeta, updateSyncMeta, getPendingChangesCount } from '@/db';
import {
    syncEngine,
    isAuthenticated,
    getCurrentSession,
    requestMagicLink,
    verifyMagicLink,
    signOut,
    isApiConfigured,
    getImageSyncStats,
    initializeChangeTracking,
    type SyncResult,
    type SyncEvent,
} from '@/lib/sync';

export interface SyncState {
    // Auth state
    isConfigured: boolean;
    isAuthenticated: boolean;
    email: string | null;
    
    // Sync state
    syncEnabled: boolean;
    lastSyncAt: string | null;
    pendingChanges: number;
    isSyncing: boolean;
    syncProgress: string | null;
    lastError: string | null;
    
    // Image sync stats
    imageStats: {
        total: number;
        synced: number;
        pending: number;
        errors: number;
    } | null;
}

export interface SyncActions {
    // Auth actions
    sendMagicLink: (email: string) => Promise<{ success: boolean; message: string }>;
    verifyToken: (token: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    
    // Sync actions
    enableSync: () => Promise<void>;
    disableSync: () => Promise<void>;
    syncNow: () => Promise<SyncResult>;
    
    // Refresh state
    refresh: () => Promise<void>;
}

const initialState: SyncState = {
    isConfigured: false,
    isAuthenticated: false,
    email: null,
    syncEnabled: false,
    lastSyncAt: null,
    pendingChanges: 0,
    isSyncing: false,
    syncProgress: null,
    lastError: null,
    imageStats: null,
};

export function useSync(): [SyncState, SyncActions] {
    const [state, setState] = useState<SyncState>(initialState);

    // Load initial state
    const refresh = useCallback(async () => {
        try {
            const isConfigured = isApiConfigured();
            const authenticated = await isAuthenticated();
            const session = await getCurrentSession();
            const meta = await getSyncMeta();
            const pendingChanges = await getPendingChangesCount();
            const imageStats = await getImageSyncStats();

            setState(prev => ({
                ...prev,
                isConfigured,
                isAuthenticated: authenticated,
                email: session?.email || null,
                syncEnabled: meta.syncEnabled,
                lastSyncAt: meta.lastSyncAt || null,
                pendingChanges,
                lastError: meta.lastError || null,
                imageStats: {
                    total: imageStats.total,
                    synced: imageStats.synced,
                    pending: imageStats.pending + imageStats.localOnly,
                    errors: imageStats.errors,
                },
            }));
        } catch (error) {
            console.error('[useSync] Failed to refresh state:', error);
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        // Initialize change tracking
        initializeChangeTracking();
        
        // Load initial state
        refresh();

        // Subscribe to sync events
        const unsubscribe = syncEngine.subscribe((event: SyncEvent) => {
            switch (event.type) {
                case 'sync:started':
                    setState(prev => ({ ...prev, isSyncing: true, syncProgress: 'Starting sync...' }));
                    break;

                case 'sync:progress':
                    const data = event.data as { step: string; current?: number; total?: number };
                    let progress = '';
                    switch (data.step) {
                        case 'pulling':
                            progress = 'Pulling changes...';
                            break;
                        case 'pushing':
                            progress = 'Pushing changes...';
                            break;
                        case 'syncing-images':
                            progress = 'Syncing images...';
                            break;
                        case 'uploading-images':
                            progress = `Uploading images (${data.current}/${data.total})...`;
                            break;
                        case 'downloading-images':
                            progress = `Downloading images (${data.current}/${data.total})...`;
                            break;
                        default:
                            progress = 'Syncing...';
                    }
                    setState(prev => ({ ...prev, syncProgress: progress }));
                    break;

                case 'sync:completed':
                    setState(prev => ({ 
                        ...prev, 
                        isSyncing: false, 
                        syncProgress: null,
                        lastError: null,
                    }));
                    refresh();
                    break;

                case 'sync:error':
                    const errorData = event.data as { error: string };
                    setState(prev => ({ 
                        ...prev, 
                        isSyncing: false, 
                        syncProgress: null,
                        lastError: errorData.error,
                    }));
                    break;

                case 'auth:required':
                    setState(prev => ({ 
                        ...prev, 
                        isAuthenticated: false,
                        syncEnabled: false,
                    }));
                    break;
            }
        });

        return () => {
            unsubscribe();
        };
    }, [refresh]);

    // Auto-refresh pending changes periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            const pendingChanges = await getPendingChangesCount();
            setState(prev => {
                if (prev.pendingChanges !== pendingChanges) {
                    return { ...prev, pendingChanges };
                }
                return prev;
            });
        }, 10000); // Every 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Actions
    const sendMagicLink = useCallback(async (email: string) => {
        const result = await requestMagicLink(email);
        return {
            success: result.success,
            message: result.message || (result.success ? 'Check your email!' : 'Failed to send'),
        };
    }, []);

    const verifyToken = useCallback(async (token: string) => {
        const result = await verifyMagicLink(token);
        if (result.success) {
            await refresh();
            // Start auto-sync after authentication
            syncEngine.startAutoSync();
        }
        return {
            success: result.success,
            error: result.error,
        };
    }, [refresh]);

    const logout = useCallback(async () => {
        syncEngine.stopAutoSync();
        await signOut();
        await refresh();
    }, [refresh]);

    const enableSync = useCallback(async () => {
        await updateSyncMeta({ syncEnabled: true });
        syncEngine.startAutoSync();
        await refresh();
    }, [refresh]);

    const disableSync = useCallback(async () => {
        syncEngine.stopAutoSync();
        await updateSyncMeta({ syncEnabled: false });
        await refresh();
    }, [refresh]);

    const syncNow = useCallback(async () => {
        const result = await syncEngine.sync();
        await refresh();
        return result;
    }, [refresh]);

    const actions: SyncActions = {
        sendMagicLink,
        verifyToken,
        logout,
        enableSync,
        disableSync,
        syncNow,
        refresh,
    };

    return [state, actions];
}


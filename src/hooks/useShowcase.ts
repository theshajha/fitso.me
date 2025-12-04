/**
 * Hook for managing public showcase settings
 * Handles enabling/disabling public profile and fetching showcase status
 */

import { getSyncMeta } from '@/db';
import { SYNC_API_URL } from '@/lib/sync/types';
import { useEffect, useState } from 'react';

export interface ShowcaseState {
    enabled: boolean;
    username: string | null;
    loading: boolean;
    error: string | null;
}

export function useShowcase(isAuthenticated: boolean) {
    const [state, setState] = useState<ShowcaseState>({
        enabled: false,
        username: null,
        loading: false,
        error: null,
    });

    // Fetch showcase status when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchStatus();
        } else {
            setState({ enabled: false, username: null, loading: false, error: null });
        }
    }, [isAuthenticated]);

    const fetchStatus = async () => {
        try {
            const meta = await getSyncMeta();
            if (!meta.sessionToken) return;

            const response = await fetch(`${SYNC_API_URL}/auth/showcase`, {
                headers: { 'Authorization': `Bearer ${meta.sessionToken}` },
            });
            const data = await response.json();
            if (data.success) {
                setState(prev => ({
                    ...prev,
                    enabled: data.showcaseEnabled,
                    username: data.username,
                    error: null,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch showcase status:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load showcase status',
            }));
        }
    };

    const toggle = async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const meta = await getSyncMeta();
            if (!meta.sessionToken) {
                setState(prev => ({ ...prev, loading: false, error: 'Not authenticated' }));
                return false;
            }

            const response = await fetch(`${SYNC_API_URL}/auth/showcase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${meta.sessionToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled: !state.enabled }),
            });
            const data = await response.json();
            if (data.success) {
                setState(prev => ({
                    ...prev,
                    enabled: data.showcaseEnabled,
                    loading: false,
                }));
                return true;
            } else {
                setState(prev => ({ ...prev, loading: false, error: data.error || 'Failed to toggle showcase' }));
                return false;
            }
        } catch (error) {
            console.error('Failed to toggle showcase:', error);
            setState(prev => ({ ...prev, loading: false, error: 'Network error' }));
            return false;
        }
    };

    const getPublicUrl = () => {
        if (!state.username) return null;
        return `${window.location.origin}/${state.username}`;
    };

    return {
        ...state,
        toggle,
        getPublicUrl,
        refresh: fetchStatus,
    };
}

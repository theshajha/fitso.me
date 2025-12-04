/**
 * Auth Client for Fitso.me Cloud Sync
 * Handles magic link authentication with Cloudflare Workers
 */

import { getSyncMeta, updateSyncMeta, clearSyncData } from '@/db';
import type { 
    AuthSession, 
    MagicLinkRequest, 
    MagicLinkResponse, 
    VerifyTokenRequest, 
    VerifyTokenResponse 
} from './types';
import { SYNC_API_URL } from './types';

/**
 * Get the configured API URL
 */
function getApiUrl(): string {
    return SYNC_API_URL;
}

/**
 * Check if the API is configured
 */
export function isApiConfigured(): boolean {
    return !!getApiUrl();
}

/**
 * Request a magic link to be sent to the email
 */
export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
        return { success: false, message: 'Sync API not configured' };
    }

    try {
        const response = await fetch(`${apiUrl}/auth/magic-link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email } as MagicLinkRequest),
        });

        const data = await response.json();
        
        if (!response.ok) {
            return { 
                success: false, 
                message: data.error || 'Failed to send magic link' 
            };
        }

        return { 
            success: true, 
            message: 'Check your email for the magic link!' 
        };
    } catch (error) {
        console.error('[Auth] Magic link request failed:', error);
        return { 
            success: false, 
            message: 'Network error. Please try again.' 
        };
    }
}

/**
 * Verify a magic link token and create a session
 */
export async function verifyMagicLink(token: string): Promise<VerifyTokenResponse> {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
        return { success: false, error: 'Sync API not configured' };
    }

    try {
        const response = await fetch(`${apiUrl}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token } as VerifyTokenRequest),
        });

        const data = await response.json();
        
        if (!response.ok) {
            return { 
                success: false, 
                error: data.error || 'Invalid or expired token' 
            };
        }

        // Store session in sync meta
        const session = data.session as AuthSession;
        await updateSyncMeta({
            userId: session.userId,
            username: session.username,
            email: session.email,
            sessionToken: session.sessionToken,
            syncEnabled: true,
        });

        return { success: true, session };
    } catch (error) {
        console.error('[Auth] Token verification failed:', error);
        return { 
            success: false, 
            error: 'Network error. Please try again.' 
        };
    }
}

/**
 * Get the current auth session from local storage
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
    const meta = await getSyncMeta();
    
    if (!meta.userId || !meta.sessionToken) {
        return null;
    }

    return {
        userId: meta.userId,
        username: meta.username || '',
        email: meta.email || '',
        sessionToken: meta.sessionToken,
        expiresAt: '', // We don't store expiry locally, server validates
    };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getCurrentSession();
    return session !== null;
}

/**
 * Get auth headers for API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getCurrentSession();
    
    if (!session) {
        return {};
    }

    return {
        'Authorization': `Bearer ${session.sessionToken}`,
    };
}

/**
 * Sign out - clear session and sync data
 */
export async function signOut(): Promise<void> {
    const apiUrl = getApiUrl();
    const session = await getCurrentSession();
    
    // Try to invalidate session on server (best effort)
    if (apiUrl && session) {
        try {
            await fetch(`${apiUrl}/auth/logout`, {
                method: 'POST',
                headers: await getAuthHeaders(),
            });
        } catch (error) {
            console.warn('[Auth] Failed to invalidate session on server:', error);
        }
    }

    // Clear local sync data
    await clearSyncData();
}

/**
 * Validate current session with server
 * Returns true if session is valid, false otherwise
 */
export async function validateSession(): Promise<boolean> {
    const apiUrl = getApiUrl();
    if (!apiUrl) return false;

    const session = await getCurrentSession();
    if (!session) return false;

    try {
        const response = await fetch(`${apiUrl}/auth/validate`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            // Session invalid, clear it
            if (response.status === 401) {
                await clearSyncData();
            }
            return false;
        }

        return true;
    } catch (error) {
        console.error('[Auth] Session validation failed:', error);
        return false;
    }
}

/**
 * Parse magic link token from URL
 * Expected format: ?token=xxxxx or /auth/verify/xxxxx
 */
export function parseTokenFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        
        // Check query parameter
        const tokenParam = urlObj.searchParams.get('token');
        if (tokenParam) return tokenParam;

        // Check path segment
        const pathMatch = urlObj.pathname.match(/\/auth\/verify\/([a-zA-Z0-9-]+)/);
        if (pathMatch) return pathMatch[1];

        return null;
    } catch {
        return null;
    }
}


/**
 * Sync Types for Fitso.me Cloud Sync
 * Using Cloudflare R2 for storage and Workers for API
 */

import type { Item, Outfit, Trip, TripItem, WishlistItem, SyncTable, ChangeOperation } from '@/db';

// API Configuration
export const SYNC_API_URL = import.meta.env.VITE_SYNC_API_URL || '';

// Sync States
export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

// Auth Types
export interface AuthSession {
    userId: string;
    username: string;  // Human-readable, used for storage and showcase URLs
    email: string;
    sessionToken: string;
    expiresAt: string;
}

export interface MagicLinkRequest {
    email: string;
}

export interface MagicLinkResponse {
    success: boolean;
    message?: string;
}

export interface VerifyTokenRequest {
    token: string;
}

export interface VerifyTokenResponse {
    success: boolean;
    session?: AuthSession;
    error?: string;
}

// Sync Protocol Types
export interface SyncPullRequest {
    sinceVersion: number;
}

export interface SyncChanges {
    items: { upserts: Omit<Item, 'imageData'>[]; deletes: string[] };
    trips: { upserts: Trip[]; deletes: string[] };
    tripItems: { upserts: TripItem[]; deletes: string[] };
    outfits: { upserts: Outfit[]; deletes: string[] };
    wishlist: { upserts: WishlistItem[]; deletes: string[] };
}

export interface SyncPullResponse {
    success: boolean;
    version: number;
    changes: SyncChanges;
    error?: string;
}

export interface LocalChange {
    id: string;
    table: SyncTable;
    recordId: string;
    operation: ChangeOperation;
    timestamp: string;
    payload?: unknown;
}

export interface SyncPushRequest {
    lastSyncVersion: number;
    changes: LocalChange[];
}

export interface SyncPushResponse {
    success: boolean;
    version: number;
    conflictIds?: string[]; // IDs that had conflicts (resolved by server)
    error?: string;
}

// Image Sync Types
export interface PresignedUrlRequest {
    hash: string;
    contentType: string;
    size: number;
}

export interface PresignedUrlResponse {
    success: boolean;
    uploadUrl?: string;
    imageRef?: string;
    alreadyExists?: boolean;
    error?: string;
}

export interface ImageDownloadResponse {
    success: boolean;
    data?: string; // base64
    error?: string;
}

// Full Sync Result
export interface SyncResult {
    success: boolean;
    pulled: number;
    pushed: number;
    imagesUploaded: number;
    imagesDownloaded: number;
    conflicts: number;
    duration: number;
    error?: string;
}

// User Data stored in R2
export interface CloudUserData {
    version: number;
    updatedAt: string;
    items: Omit<Item, 'imageData'>[];
    trips: Trip[];
    tripItems: TripItem[];
    outfits: Outfit[];
    wishlist: WishlistItem[];
}

// Sync Events (for UI updates)
export type SyncEventType = 
    | 'sync:started'
    | 'sync:progress'
    | 'sync:completed'
    | 'sync:error'
    | 'sync:conflict'
    | 'auth:required'
    | 'auth:success'
    | 'auth:logout';

export interface SyncEvent {
    type: SyncEventType;
    data?: unknown;
}

export type SyncEventHandler = (event: SyncEvent) => void;

// Conflict Resolution Strategy
export type ConflictStrategy = 'server-wins' | 'client-wins' | 'last-write-wins';

// Sync Configuration
export interface SyncConfig {
    apiUrl: string;
    conflictStrategy: ConflictStrategy;
    autoSyncInterval: number; // ms, 0 = disabled
    syncOnChange: boolean; // Sync immediately on local changes
    syncDebounceMs: number; // Debounce time for change-triggered syncs
    maxRetries: number;
    retryDelayMs: number;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    apiUrl: SYNC_API_URL,
    conflictStrategy: 'last-write-wins',
    autoSyncInterval: 5 * 60 * 1000, // 5 minutes
    syncOnChange: true,
    syncDebounceMs: 5000, // 5 seconds
    maxRetries: 3,
    retryDelayMs: 1000,
};


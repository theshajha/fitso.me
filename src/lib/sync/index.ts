/**
 * Sync Module for Fitso.me
 * Cloud sync using Cloudflare R2 + Workers
 */

// Types
export type {
    AuthSession,
    MagicLinkRequest,
    MagicLinkResponse,
    VerifyTokenRequest,
    VerifyTokenResponse,
    SyncPullRequest,
    SyncPullResponse,
    SyncPushRequest,
    SyncPushResponse,
    SyncChanges,
    LocalChange,
    SyncResult,
    SyncEvent,
    SyncEventType,
    SyncEventHandler,
    SyncConfig,
    SyncState,
    PresignedUrlRequest,
    PresignedUrlResponse,
} from './types';

export { SYNC_API_URL, DEFAULT_SYNC_CONFIG } from './types';

// Auth
export {
    requestMagicLink,
    verifyMagicLink,
    getCurrentSession,
    isAuthenticated,
    getAuthHeaders,
    signOut,
    validateSession,
    parseTokenFromUrl,
    isApiConfigured,
} from './auth';

// Change Tracking
export {
    initializeChangeTracking,
    setTrackingEnabled,
    isTrackingEnabled,
    applyServerChanges,
    bulkImportWithoutTracking,
    clearTableWithoutTracking,
} from './changeTracker';

// Image Sync
export {
    uploadImage,
    downloadImage,
    syncAllImages,
    downloadMissingImages,
    checkImageExists,
    getImageSyncStats,
} from './imageSync';

// Sync Engine
export { syncEngine, SyncEngine } from './syncEngine';


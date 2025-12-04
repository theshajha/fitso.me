/**
 * Data Access Layer for R2 Storage
 * Centralizes all R2 read/write operations for user data
 * Handles both new split-file format and legacy monolithic format
 */

import type { Session, SyncItem, SyncOutfit, SyncTrip, SyncTripItem, SyncWishlistItem, UserData } from '../types';

export type SyncableRecord = SyncItem | SyncTrip | SyncTripItem | SyncOutfit | SyncWishlistItem;

export interface Metadata {
  version: number;
  updatedAt: string;
}

export interface UserDataSnapshot {
  items: SyncItem[];
  trips: SyncTrip[];
  tripItems: SyncTripItem[];
  outfits: SyncOutfit[];
  wishlist: SyncWishlistItem[];
}

/**
 * Load metadata from R2
 * Returns default metadata if file doesn't exist
 */
export async function loadMetadata(bucket: R2Bucket, username: string): Promise<Metadata> {
  const metadataKey = `${username}/metadata.json`;
  const metadataObject = await bucket.get(metadataKey);

  if (!metadataObject) {
    // Initialize with default metadata
    return {
      version: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  return await metadataObject.json<Metadata>();
}

/**
 * Save metadata to R2
 */
export async function saveMetadata(
  bucket: R2Bucket,
  username: string,
  metadata: Metadata,
  session: Session
): Promise<void> {
  const metadataKey = `${username}/metadata.json`;
  await bucket.put(metadataKey, JSON.stringify(metadata), {
    customMetadata: {
      userId: session.userId,
      username: session.username,
      version: String(metadata.version),
      updatedAt: metadata.updatedAt,
    },
  });
}

/**
 * Load table data from R2
 * Returns empty array if file doesn't exist
 */
export async function loadTableData<T extends SyncableRecord>(
  bucket: R2Bucket,
  username: string,
  tableName: string
): Promise<T[]> {
  const tableKey = `${username}/${tableName}.json`;
  const tableObject = await bucket.get(tableKey);

  if (!tableObject) {
    return [];
  }

  return await tableObject.json<T[]>();
}

/**
 * Save table data to R2
 */
export async function saveTableData<T extends SyncableRecord>(
  bucket: R2Bucket,
  username: string,
  tableName: string,
  data: T[]
): Promise<void> {
  const tableKey = `${username}/${tableName}.json`;
  await bucket.put(tableKey, JSON.stringify(data));
}

/**
 * Load all user data from R2
 * Handles both new split-file format and legacy monolithic format
 * Returns empty data structure if no data exists
 */
export async function loadUserData(bucket: R2Bucket, username: string): Promise<UserDataSnapshot> {
  // Try loading from new split-file format first
  const itemsObject = await bucket.get(`${username}/items.json`);

  if (itemsObject) {
    // New format exists, load all split files in parallel
    const [items, trips, tripItems, outfits, wishlist] = await Promise.all([
      loadTableData<SyncItem>(bucket, username, 'items'),
      loadTableData<SyncTrip>(bucket, username, 'trips'),
      loadTableData<SyncTripItem>(bucket, username, 'tripItems'),
      loadTableData<SyncOutfit>(bucket, username, 'outfits'),
      loadTableData<SyncWishlistItem>(bucket, username, 'wishlist'),
    ]);

    return { items, trips, tripItems, outfits, wishlist };
  }

  // Fallback to legacy monolithic format
  const oldDataObject = await bucket.get(`${username}/data.json`);

  if (oldDataObject) {
    const userData = await oldDataObject.json<UserData>();
    return {
      items: userData.items || [],
      trips: userData.trips || [],
      tripItems: userData.tripItems || [],
      outfits: userData.outfits || [],
      wishlist: userData.wishlist || [],
    };
  }

  // No data exists, return empty structure
  return {
    items: [],
    trips: [],
    tripItems: [],
    outfits: [],
    wishlist: [],
  };
}

/**
 * Load only featured (public) items and outfits for showcase
 * Filters out deleted and non-featured items
 */
export async function loadFeaturedData(
  bucket: R2Bucket,
  username: string
): Promise<{ items: SyncItem[]; outfits: SyncOutfit[] }> {
  const userData = await loadUserData(bucket, username);

  const featuredItems = userData.items.filter(item => !item._deleted && item.isFeatured === true);
  const featuredOutfits = userData.outfits.filter(outfit => !outfit._deleted && outfit.isFeatured === true);

  return {
    items: featuredItems,
    outfits: featuredOutfits,
  };
}

/**
 * Check if user data exists in R2 (either format)
 */
export async function userDataExists(bucket: R2Bucket, username: string): Promise<boolean> {
  // Check for new format
  const newFormatExists = await bucket.get(`${username}/items.json`);
  if (newFormatExists) return true;

  // Check for old format
  const oldFormatExists = await bucket.get(`${username}/data.json`);
  return !!oldFormatExists;
}

/**
 * Migrate user from old monolithic format to new split-file format
 * This is called automatically during first sync after migration
 */
export async function migrateToSplitFormat(
  bucket: R2Bucket,
  username: string,
  session: Session
): Promise<boolean> {
  // Check if already migrated
  const newFormatExists = await bucket.get(`${username}/items.json`);
  if (newFormatExists) {
    return false; // Already migrated
  }

  // Load old format
  const oldDataObject = await bucket.get(`${username}/data.json`);
  if (!oldDataObject) {
    return false; // No data to migrate
  }

  const userData = await oldDataObject.json<UserData>();

  // Save to new split format
  await Promise.all([
    saveTableData(bucket, username, 'items', userData.items || []),
    saveTableData(bucket, username, 'trips', userData.trips || []),
    saveTableData(bucket, username, 'tripItems', userData.tripItems || []),
    saveTableData(bucket, username, 'outfits', userData.outfits || []),
    saveTableData(bucket, username, 'wishlist', userData.wishlist || []),
  ]);

  // Save metadata
  await saveMetadata(bucket, username, {
    version: userData.version,
    updatedAt: userData.updatedAt,
  }, session);

  // Optionally: Delete old data.json file (commented out for safety)
  // await bucket.delete(`${username}/data.json`);

  console.log(`[DataAccess] Migrated user ${username} to split-file format`);
  return true;
}

/**
 * Image Routes for Fitso.me Sync API
 * Handles image upload/download with R2 storage and deduplication
 */

import { Hono } from 'hono';
import type { Env, Session, ImageMetadata } from '../types';

export const imagesRouter = new Hono<{ 
  Bindings: Env; 
  Variables: { session: Session } 
}>();

// Maximum image size (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * POST /images/presign-upload
 * Get a presigned URL for direct upload to R2
 */
imagesRouter.post('/presign-upload', async (c) => {
  try {
    const session = c.get('session');
    const body = await c.req.json<{
      hash: string;
      contentType: string;
      size: number;
    }>();

    const { hash, contentType, size } = body;

    // Validate input
    if (!hash || typeof hash !== 'string' || hash.length !== 64) {
      return c.json({ success: false, error: 'Invalid hash' }, 400);
    }

    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return c.json({ success: false, error: 'Invalid content type' }, 400);
    }

    if (!size || size > MAX_IMAGE_SIZE) {
      return c.json({ success: false, error: 'Image too large (max 10MB)' }, 400);
    }

    // Image key uses hash for deduplication (shared across users)
    const imageKey = `images/${hash}`;

    // Check if image already exists (deduplication)
    const existing = await c.env.R2_IMAGES.head(imageKey);
    if (existing) {
      return c.json({
        success: true,
        alreadyExists: true,
        imageRef: imageKey,
      });
    }

    // For Cloudflare R2, we can't create presigned URLs directly in Workers
    // Instead, we'll handle the upload through the Worker
    // Return a special endpoint URL for upload
    return c.json({
      success: true,
      alreadyExists: false,
      imageRef: imageKey,
      uploadUrl: `/images/upload/${hash}`,
      // Note: In production, you might want to use R2's multipart upload
      // or a direct presigned URL if you enable it in your R2 bucket settings
    });
  } catch (error) {
    console.error('Presign upload error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * PUT /images/upload/:hash
 * Upload an image directly through the Worker
 */
imagesRouter.put('/upload/:hash', async (c) => {
  try {
    const session = c.get('session');
    const hash = c.req.param('hash');

    if (!hash || hash.length !== 64) {
      return c.json({ success: false, error: 'Invalid hash' }, 400);
    }

    const contentType = c.req.header('Content-Type');
    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return c.json({ success: false, error: 'Invalid content type' }, 400);
    }

    const body = await c.req.arrayBuffer();
    
    if (body.byteLength > MAX_IMAGE_SIZE) {
      return c.json({ success: false, error: 'Image too large' }, 400);
    }

    // Verify hash matches content
    const computedHash = await computeHash(body);
    if (computedHash !== hash) {
      return c.json({ success: false, error: 'Hash mismatch' }, 400);
    }

    const imageKey = `images/${hash}`;

    // Check if already exists
    const existing = await c.env.R2_IMAGES.head(imageKey);
    if (existing) {
      return c.json({
        success: true,
        imageRef: imageKey,
        message: 'Image already exists',
      });
    }

    // Upload to R2
    const metadata: ImageMetadata = {
      hash,
      contentType,
      size: body.byteLength,
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.userId,
    };

    await c.env.R2_IMAGES.put(imageKey, body, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: metadata as unknown as Record<string, string>,
    });

    return c.json({
      success: true,
      imageRef: imageKey,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * GET /images/check/:hash
 * Check if an image exists
 */
imagesRouter.get('/check/:hash', async (c) => {
  try {
    const hash = c.req.param('hash');

    if (!hash || hash.length !== 64) {
      return c.json({ exists: false });
    }

    const imageKey = `images/${hash}`;
    const existing = await c.env.R2_IMAGES.head(imageKey);

    return c.json({ exists: !!existing });
  } catch (error) {
    console.error('Image check error:', error);
    return c.json({ exists: false });
  }
});

/**
 * GET /images/:path
 * Download an image
 */
imagesRouter.get('/:path{.+}', async (c) => {
  try {
    const path = c.req.param('path');

    if (!path) {
      return c.json({ error: 'Path required' }, 400);
    }

    // Ensure path is within images directory
    const imageKey = path.startsWith('images/') ? path : `images/${path}`;

    const object = await c.env.R2_IMAGES.get(imageKey);

    if (!object) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    // Check for conditional request
    const ifNoneMatch = c.req.header('If-None-Match');
    if (ifNoneMatch === object.httpEtag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Image download error:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

/**
 * DELETE /images/:hash
 * Delete an image (admin only or ownership check)
 */
imagesRouter.delete('/:hash', async (c) => {
  try {
    const session = c.get('session');
    const hash = c.req.param('hash');

    if (!hash || hash.length !== 64) {
      return c.json({ success: false, error: 'Invalid hash' }, 400);
    }

    const imageKey = `images/${hash}`;

    // Get image metadata to check ownership
    const object = await c.env.R2_IMAGES.head(imageKey);
    if (!object) {
      return c.json({ success: true, message: 'Image already deleted' });
    }

    // Check if user uploaded this image
    const uploadedBy = object.customMetadata?.uploadedBy;
    if (uploadedBy && uploadedBy !== session.userId) {
      // For shared images, we don't delete - just acknowledge
      // In a production system, you might implement reference counting
      return c.json({ success: true, message: 'Image is shared' });
    }

    await c.env.R2_IMAGES.delete(imageKey);

    return c.json({ success: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

/**
 * Compute SHA-256 hash of data
 */
async function computeHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


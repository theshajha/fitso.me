import posthog from 'posthog-js'

// Initialize PostHog
export function initAnalytics() {
    const apiKey = import.meta.env.VITE_POSTHOG_KEY
    const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

    if (!apiKey) {
        console.warn('PostHog API key not configured. Analytics disabled.')
        return false
    }

    posthog.init(apiKey, {
        api_host: apiHost,
        // Respect user's Do Not Track setting
        respect_dnt: true,
        // Capture page views automatically
        capture_pageview: true,
        // Capture page leaves
        capture_pageleave: true,
        // Disable in development if needed
        loaded: (posthog) => {
            if (import.meta.env.DEV) {
                console.log('PostHog initialized in development mode')
            }
        },
        // Privacy-friendly settings
        persistence: 'localStorage',
        // Disable autocapture for more control
        autocapture: false,
    })

    return true
}

// Identify user when they sign up or provide their name
export function identifyUser(name: string) {
    if (!isAnalyticsEnabled()) return

    // Generate a simple anonymous ID based on name + timestamp
    const distinctId = `user_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

    posthog.identify(distinctId, {
        name: name,
        signed_up_at: new Date().toISOString(),
    })

    // Track signup event
    trackEvent('user_signed_up', {
        name: name,
    })
}

// Update user properties
export function updateUserProperties(properties: Record<string, unknown>) {
    if (!isAnalyticsEnabled()) return
    posthog.people.set(properties)
}

// Track custom events
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
    if (!isAnalyticsEnabled()) return
    posthog.capture(eventName, properties)
}

// Track page views manually (for SPA navigation)
export function trackPageView(pageName?: string) {
    if (!isAnalyticsEnabled()) return
    posthog.capture('$pageview', {
        page_name: pageName,
    })
}

// Check if analytics is enabled
export function isAnalyticsEnabled(): boolean {
    return Boolean(import.meta.env.VITE_POSTHOG_KEY)
}

// Opt out of tracking
export function optOut() {
    posthog.opt_out_capturing()
}

// Opt back in to tracking
export function optIn() {
    posthog.opt_in_capturing()
}

// Check if user has opted out
export function hasOptedOut(): boolean {
    return posthog.has_opted_out_capturing()
}

// Reset tracking (e.g., on logout or data clear)
export function resetAnalytics() {
    posthog.reset()
}

// ============================================
// Pre-defined event helpers for common actions
// ============================================

// Item events
export function trackItemAdded(category: string, hasImage: boolean) {
    trackEvent('item_added', { category, has_image: hasImage })
}

export function trackItemEdited(category: string) {
    trackEvent('item_edited', { category })
}

export function trackItemDeleted(category: string) {
    trackEvent('item_deleted', { category })
}

// Outfit events
export function trackOutfitCreated(itemCount: number) {
    trackEvent('outfit_created', { item_count: itemCount })
}

// Trip events
export function trackTripCreated(destination?: string) {
    trackEvent('trip_created', { has_destination: Boolean(destination) })
}

export function trackItemPacked() {
    trackEvent('item_packed')
}

// Showcase events
export function trackShowcaseShared(method: 'url' | 'html') {
    trackEvent('showcase_shared', { method })
}

export function trackItemFeatured() {
    trackEvent('item_featured')
}

// Wishlist events
export function trackWishlistItemAdded(priority: string, hasLink: boolean) {
    trackEvent('wishlist_item_added', { priority, has_link: hasLink })
}

export function trackWishlistItemPurchased() {
    trackEvent('wishlist_item_purchased')
}

// Data management events
export function trackDataExported(withImages: boolean) {
    trackEvent('data_exported', { with_images: withImages })
}

export function trackDataImported(itemCount: number) {
    trackEvent('data_imported', { item_count: itemCount })
}

// Feature usage
export function trackFeatureUsed(feature: string) {
    trackEvent('feature_used', { feature })
}

export default posthog


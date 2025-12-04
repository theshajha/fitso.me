import posthog from 'posthog-js'

// ============================================
// FITSO.ME Analytics & User Journey Tracking
// ============================================
//
// USER JOURNEY STAGES:
// 1. VISITOR     - Landed on page, browsing
// 2. ACTIVATED   - Created account (provided name) OR tried demo
// 3. ENGAGED     - Added first item, outfit, trip, or wishlist item
// 4. RETAINED    - Multiple sessions, using multiple features
// 5. POWER USER  - Regular usage, exports, showcase sharing
//
// KEY CONVERSION FUNNELS:
// - Landing → Signup → First Item → 5 Items → 25 Items
// - Landing → Demo → Exit Demo → Real Signup
// - Inventory → Outfit Created → Trip Planned
// - Item Added → Featured → Showcase Shared
// - Wishlist → Purchased
//

// ============================================
// Core Analytics Setup
// ============================================

export function initAnalytics() {
    const apiKey = import.meta.env.VITE_POSTHOG_KEY
    const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

    if (!apiKey) {
        console.warn('PostHog API key not configured. Analytics disabled.')
        return false
    }

    posthog.init(apiKey, {
        api_host: apiHost,
        respect_dnt: true,
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (_posthog) => {
            if (import.meta.env.DEV) {
                console.log('PostHog initialized in development mode')
            }
        },
        persistence: 'localStorage',
        autocapture: false,
        // Enable session recording for deeper insights (optional)
        // disable_session_recording: false,
    })

    return true
}

export function isAnalyticsEnabled(): boolean {
    return Boolean(import.meta.env.VITE_POSTHOG_KEY)
}

export function optOut() {
    posthog.opt_out_capturing()
}

export function optIn() {
    posthog.opt_in_capturing()
}

export function hasOptedOut(): boolean {
    return posthog.has_opted_out_capturing()
}

export function resetAnalytics() {
    posthog.reset()
}

// ============================================
// User Identification & Properties
// ============================================

export function identifyUser(name: string) {
    if (!isAnalyticsEnabled()) return

    const distinctId = `user_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

    posthog.identify(distinctId, {
        name: name,
        signed_up_at: new Date().toISOString(),
        journey_stage: 'activated',
    })

    trackEvent('user_signed_up', { name })
}

// Update user journey stage and properties
export function updateUserProperties(properties: Record<string, unknown>) {
    if (!isAnalyticsEnabled()) return
    posthog.people.set(properties)
}

// Increment numeric properties (for counters)
export function incrementUserProperty(property: string, amount: number = 1) {
    if (!isAnalyticsEnabled()) return
    posthog.people.set_once({ [property]: 0 }) // Initialize if not exists
    posthog.capture('$set', {
        $set: { [property]: { $increment: amount } }
    })
}

// Set properties only once (for first-time events)
export function setOnceUserProperty(property: string, value: unknown) {
    if (!isAnalyticsEnabled()) return
    posthog.people.set_once({ [property]: value })
}

// ============================================
// Core Event Tracking
// ============================================

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
    if (!isAnalyticsEnabled()) return
    posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
    })
}

export function trackPageView(pageName?: string) {
    if (!isAnalyticsEnabled()) return
    posthog.capture('$pageview', {
        page_name: pageName,
        timestamp: new Date().toISOString(),
    })
}

// ============================================
// JOURNEY STAGE 1: VISITOR EVENTS
// ============================================

export function trackLandingPageViewed() {
    trackEvent('landing_page_viewed')
    setOnceUserProperty('first_visit_at', new Date().toISOString())
}

export function trackGetStartedClicked() {
    trackEvent('get_started_clicked')
}

export function trackDemoModeClicked() {
    trackEvent('demo_mode_clicked')
}

// ============================================
// JOURNEY STAGE 2: ACTIVATION EVENTS
// ============================================

// Track when user completes onboarding
export function trackOnboardingCompleted(withName: boolean) {
    trackEvent('onboarding_completed', { 
        provided_name: withName,
    })
    updateUserProperties({
        journey_stage: 'activated',
        activated_at: new Date().toISOString(),
    })
}

export function trackOnboardingSkipped() {
    trackEvent('onboarding_skipped')
    updateUserProperties({
        journey_stage: 'activated',
        activated_at: new Date().toISOString(),
    })
}

// Demo mode tracking
export function trackDemoEntered(demoType: 'him' | 'her') {
    trackEvent('demo_entered', { demo_type: demoType })
    setOnceUserProperty('first_demo_at', new Date().toISOString())
}

export function trackDemoExited(demoType: 'him' | 'her') {
    trackEvent('demo_exited', { demo_type: demoType })
}

// Track conversion from demo to real user
export function trackDemoToRealConversion() {
    trackEvent('demo_to_real_conversion')
    updateUserProperties({
        converted_from_demo: true,
        converted_at: new Date().toISOString(),
    })
}

// ============================================
// JOURNEY STAGE 3: ENGAGEMENT EVENTS (First Actions)
// ============================================

// Track first-time milestone events
export function trackFirstItemAdded(category: string) {
    trackEvent('first_item_added', { category })
    setOnceUserProperty('first_item_added_at', new Date().toISOString())
    updateUserProperties({ journey_stage: 'engaged' })
}

export function trackFirstOutfitCreated() {
    trackEvent('first_outfit_created')
    setOnceUserProperty('first_outfit_at', new Date().toISOString())
}

export function trackFirstTripPlanned() {
    trackEvent('first_trip_planned')
    setOnceUserProperty('first_trip_at', new Date().toISOString())
}

export function trackFirstWishlistAdded() {
    trackEvent('first_wishlist_added')
    setOnceUserProperty('first_wishlist_at', new Date().toISOString())
}

export function trackFirstShowcaseCreated() {
    trackEvent('first_showcase_created')
    setOnceUserProperty('first_showcase_at', new Date().toISOString())
}

// ============================================
// JOURNEY STAGE 4: RETENTION EVENTS (Milestones)
// ============================================

// Inventory milestones
export function trackInventoryMilestone(count: number) {
    const milestones = [5, 10, 25, 50, 100, 250, 500]
    if (milestones.includes(count)) {
        trackEvent('inventory_milestone_reached', { 
            milestone: count,
            milestone_type: 'items',
        })
        setOnceUserProperty(`reached_${count}_items_at`, new Date().toISOString())
        
        // Update journey stage at key milestones
        if (count >= 25) {
            updateUserProperties({ journey_stage: 'retained' })
        }
    }
}

// Outfit milestones
export function trackOutfitMilestone(count: number) {
    const milestones = [3, 5, 10, 25]
    if (milestones.includes(count)) {
        trackEvent('outfit_milestone_reached', { milestone: count })
    }
}

// Session milestones
export function trackSessionStart() {
    const sessionCount = parseInt(localStorage.getItem('fitsome_session_count') || '0') + 1
    localStorage.setItem('fitsome_session_count', sessionCount.toString())
    
    trackEvent('session_started', { session_number: sessionCount })
    updateUserProperties({ 
        total_sessions: sessionCount,
        last_session_at: new Date().toISOString(),
    })
    
    // Track returning user
    if (sessionCount > 1) {
        trackEvent('returning_user_session')
    }
    
    // Session milestones
    const milestones = [5, 10, 25, 50, 100]
    if (milestones.includes(sessionCount)) {
        trackEvent('session_milestone_reached', { milestone: sessionCount })
    }
}

// ============================================
// JOURNEY STAGE 5: POWER USER EVENTS
// ============================================

export function trackPowerUserAction(action: string) {
    trackEvent('power_user_action', { action })
    updateUserProperties({ journey_stage: 'power_user' })
}

// ============================================
// FEATURE-SPECIFIC EVENTS
// ============================================

// Item Events
export function trackItemAdded(category: string, hasImage: boolean, cost?: number) {
    trackEvent('item_added', { 
        category, 
        has_image: hasImage,
        has_cost: cost !== undefined && cost > 0,
    })
}

export function trackItemEdited(category: string, fieldsChanged?: string[]) {
    trackEvent('item_edited', { 
        category,
        fields_changed: fieldsChanged,
    })
}

export function trackItemDeleted(category: string) {
    trackEvent('item_deleted', { category })
}

export function trackItemDuplicated(category: string) {
    trackEvent('item_duplicated', { category })
}

export function trackItemPhaseOutToggled(isPhaseOut: boolean) {
    trackEvent('item_phase_out_toggled', { phase_out: isPhaseOut })
}

// Outfit Events
export function trackOutfitCreated(itemCount: number, occasion?: string) {
    trackEvent('outfit_created', { 
        item_count: itemCount,
        occasion,
    })
}

export function trackOutfitEdited() {
    trackEvent('outfit_edited')
}

export function trackOutfitDeleted() {
    trackEvent('outfit_deleted')
}

// Trip Events
export function trackTripCreated(destination?: string, climate?: string) {
    trackEvent('trip_created', { 
        has_destination: Boolean(destination),
        climate,
    })
}

export function trackTripEdited() {
    trackEvent('trip_edited')
}

export function trackItemPacked() {
    trackEvent('item_packed')
}

export function trackTripCompleted() {
    trackEvent('trip_completed')
    trackPowerUserAction('completed_trip')
}

// Showcase Events
export function trackItemFeatured() {
    trackEvent('item_featured')
}

export function trackItemUnfeatured() {
    trackEvent('item_unfeatured')
}

export function trackShowcaseShared(method: 'url' | 'html') {
    trackEvent('showcase_shared', { method })
    trackPowerUserAction(`showcase_shared_${method}`)
}

export function trackShowcaseViewed() {
    trackEvent('showcase_viewed')
}

// Wishlist Events
export function trackWishlistItemAdded(priority: string, hasLink: boolean, category?: string) {
    trackEvent('wishlist_item_added', { 
        priority, 
        has_link: hasLink,
        category,
    })
}

export function trackWishlistItemPurchased(estimatedCost?: number) {
    trackEvent('wishlist_item_purchased', {
        had_estimated_cost: estimatedCost !== undefined,
    })
}

export function trackWishlistItemDeleted() {
    trackEvent('wishlist_item_deleted')
}

// Data Management Events
export function trackDataExported(withImages: boolean) {
    trackEvent('data_exported', { with_images: withImages })
    trackPowerUserAction('data_exported')
}

export function trackDataImported(itemCount: number, hadImages: boolean) {
    trackEvent('data_imported', { 
        item_count: itemCount,
        had_images: hadImages,
    })
}

export function trackAutoExportEnabled() {
    trackEvent('auto_export_enabled')
    trackPowerUserAction('auto_export_setup')
}

// Search & Filter Events
export function trackSearchUsed(query: string, resultCount: number) {
    trackEvent('search_used', { 
        query_length: query.length,
        result_count: resultCount,
    })
}

export function trackFilterUsed(filterType: string, filterValue: string) {
    trackEvent('filter_used', { 
        filter_type: filterType,
        filter_value: filterValue,
    })
}

// View Mode Events
export function trackViewModeChanged(mode: 'grid' | 'list') {
    trackEvent('view_mode_changed', { mode })
}

// Feature Discovery
export function trackFeatureUsed(feature: string) {
    trackEvent('feature_used', { feature })
}

export function trackFeatureDiscovered(feature: string) {
    trackEvent('feature_discovered', { feature })
    setOnceUserProperty(`discovered_${feature}_at`, new Date().toISOString())
}

// ============================================
// AGGREGATE METRICS (Update periodically)
// ============================================

export function updateInventoryMetrics(stats: {
    totalItems: number
    totalWorth: number
    categories: Record<string, number>
    itemsWithImages: number
}) {
    if (!isAnalyticsEnabled()) return
    
    updateUserProperties({
        total_items: stats.totalItems,
        total_worth: stats.totalWorth,
        items_with_images: stats.itemsWithImages,
        top_category: Object.entries(stats.categories)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
    })
}

export function updateEngagementMetrics(stats: {
    totalOutfits: number
    totalTrips: number
    totalWishlist: number
    featuredItems: number
}) {
    if (!isAnalyticsEnabled()) return
    
    updateUserProperties({
        total_outfits: stats.totalOutfits,
        total_trips: stats.totalTrips,
        total_wishlist: stats.totalWishlist,
        featured_items: stats.featuredItems,
    })
}

// ============================================
// ERROR TRACKING
// ============================================

export function trackError(errorType: string, errorMessage: string, context?: string) {
    trackEvent('error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        context,
    })
}

// ============================================
// FUNNEL HELPERS
// ============================================

// Track complete funnels for PostHog
export const FUNNELS = {
    ONBOARDING: ['landing_page_viewed', 'get_started_clicked', 'onboarding_completed', 'first_item_added'],
    DEMO_CONVERSION: ['landing_page_viewed', 'demo_mode_clicked', 'demo_entered', 'demo_exited', 'user_signed_up'],
    INVENTORY_GROWTH: ['first_item_added', 'inventory_milestone_reached'],
    OUTFIT_CREATION: ['item_added', 'outfit_created'],
    TRIP_PLANNING: ['trip_created', 'item_packed', 'trip_completed'],
    SHOWCASE_SHARE: ['item_featured', 'showcase_shared'],
    WISHLIST_PURCHASE: ['wishlist_item_added', 'wishlist_item_purchased'],
}

// ============================================
// POSTHOG FEATURE FLAGS (for A/B testing)
// ============================================

export function isFeatureEnabled(featureKey: string): boolean {
    if (!isAnalyticsEnabled()) return false
    return posthog.isFeatureEnabled(featureKey) || false
}

export function getFeatureFlag(featureKey: string): string | boolean | undefined {
    if (!isAnalyticsEnabled()) return undefined
    return posthog.getFeatureFlag(featureKey)
}

export default posthog

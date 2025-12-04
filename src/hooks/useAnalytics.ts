import { db } from '@/db'
import {
    trackFirstItemAdded,
    trackFirstOutfitCreated,
    trackFirstTripPlanned,
    trackFirstWishlistAdded,
    trackInventoryMilestone,
    trackOutfitMilestone,
    trackSessionStart,
    updateEngagementMetrics,
    updateInventoryMetrics,
} from '@/lib/analytics'
import { isDemoMode } from '@/lib/demo'
import { useCallback, useEffect, useRef } from 'react'

// Key for tracking first-time events
const MILESTONES_KEY = 'fitsome_milestones'

interface Milestones {
    firstItemAdded: boolean
    firstOutfitCreated: boolean
    firstTripPlanned: boolean
    firstWishlistAdded: boolean
    itemMilestones: number[]
    outfitMilestones: number[]
}

function getMilestones(): Milestones {
    try {
        const stored = localStorage.getItem(MILESTONES_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('Failed to load milestones:', e)
    }
    return {
        firstItemAdded: false,
        firstOutfitCreated: false,
        firstTripPlanned: false,
        firstWishlistAdded: false,
        itemMilestones: [],
        outfitMilestones: [],
    }
}

function saveMilestones(milestones: Milestones) {
    try {
        localStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones))
    } catch (e) {
        console.error('Failed to save milestones:', e)
    }
}

/**
 * Hook to handle analytics tracking and milestone detection
 */
export function useAnalytics() {
    const hasTrackedSession = useRef(false)

    // Track session start (only once per app mount)
    useEffect(() => {
        if (!hasTrackedSession.current && !isDemoMode()) {
            hasTrackedSession.current = true
            trackSessionStart()
        }
    }, [])

    // Check and track first-time milestones
    const checkMilestones = useCallback(async () => {
        if (isDemoMode()) return

        const milestones = getMilestones()
        let updated = false

        try {
            // Check items
            const items = await db.items.toArray()
            const itemCount = items.length

            if (itemCount > 0 && !milestones.firstItemAdded) {
                const firstItem = items[0]
                trackFirstItemAdded(firstItem.category)
                milestones.firstItemAdded = true
                updated = true
            }

            // Check item milestones
            const itemMilestones = [5, 10, 25, 50, 100, 250, 500]
            for (const milestone of itemMilestones) {
                if (itemCount >= milestone && !milestones.itemMilestones.includes(milestone)) {
                    trackInventoryMilestone(milestone)
                    milestones.itemMilestones.push(milestone)
                    updated = true
                }
            }

            // Check outfits
            const outfits = await db.outfits.toArray()
            const outfitCount = outfits.length

            if (outfitCount > 0 && !milestones.firstOutfitCreated) {
                trackFirstOutfitCreated()
                milestones.firstOutfitCreated = true
                updated = true
            }

            // Check outfit milestones
            const outfitMilestonesList = [3, 5, 10, 25]
            for (const milestone of outfitMilestonesList) {
                if (outfitCount >= milestone && !milestones.outfitMilestones.includes(milestone)) {
                    trackOutfitMilestone(milestone)
                    milestones.outfitMilestones.push(milestone)
                    updated = true
                }
            }

            // Check trips
            const trips = await db.trips.toArray()
            if (trips.length > 0 && !milestones.firstTripPlanned) {
                trackFirstTripPlanned()
                milestones.firstTripPlanned = true
                updated = true
            }

            // Check wishlist
            const wishlist = await db.wishlist.toArray()
            if (wishlist.length > 0 && !milestones.firstWishlistAdded) {
                trackFirstWishlistAdded()
                milestones.firstWishlistAdded = true
                updated = true
            }

            // Update aggregate metrics
            const itemsWithImages = items.filter(i => i.image).length
            const totalWorth = items.reduce((sum, item) => sum + (item.cost || 0), 0)
            const categories: Record<string, number> = {}
            items.forEach(item => {
                categories[item.category] = (categories[item.category] || 0) + 1
            })

            updateInventoryMetrics({
                totalItems: itemCount,
                totalWorth,
                categories,
                itemsWithImages,
            })

            const featuredItems = items.filter(i => i.isFeatured).length
            updateEngagementMetrics({
                totalOutfits: outfitCount,
                totalTrips: trips.length,
                totalWishlist: wishlist.length,
                featuredItems,
            })

            if (updated) {
                saveMilestones(milestones)
            }
        } catch (e) {
            console.error('Failed to check milestones:', e)
        }
    }, [])

    return {
        checkMilestones,
    }
}

/**
 * Hook to track when a specific item is added
 */
export function useTrackItemAdded() {
    return useCallback((category: string, hasImage: boolean, cost?: number) => {
        if (isDemoMode()) return

        // Import dynamically to avoid circular deps
        import('@/lib/analytics').then(({ trackItemAdded }) => {
            trackItemAdded(category, hasImage, cost)
        })
    }, [])
}


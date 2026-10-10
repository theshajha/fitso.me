import { trackPageView } from '@/lib/analytics'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Component to track page views on route changes
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation()

    useEffect(() => {
        // Track page view on route change
        const pageName = location.pathname.replace('/', '') || 'landing'
        trackPageView(pageName)
    }, [location])

    return <>{children}</>
}


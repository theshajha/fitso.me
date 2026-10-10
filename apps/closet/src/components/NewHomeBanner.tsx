import { X } from 'lucide-react'
import { useState } from 'react'

const NEW_HOME_URL = import.meta.env.VITE_NEW_HOME_URL || 'https://fitso.me'
const STORAGE_KEY = 'fitso-new-home-banner-dismissed'

function readDismissed(): boolean {
    try {
        return sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
        return false
    }
}

export function NewHomeBanner() {
    const [dismissed, setDismissed] = useState(readDismissed)

    if (dismissed) return null

    const handleDismiss = () => {
        setDismissed(true)
        try {
            sessionStorage.setItem(STORAGE_KEY, '1')
        } catch {
            // sessionStorage unavailable; dismiss for this render only
        }
    }

    return (
        <div className="relative z-[110] bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 text-white px-4 py-1.5 text-sm">
            <div className="max-w-screen-xl mx-auto flex items-center justify-center gap-3">
                <p className="text-center">
                    fitso has a new home at{' '}
                    <a href={NEW_HOME_URL} className="font-semibold underline underline-offset-2 hover:text-white/80">
                        fitso.me
                    </a>
                    . Your closet stays here.
                </p>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss"
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

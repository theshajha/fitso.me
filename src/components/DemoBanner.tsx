import { Button } from '@/components/ui/button'
import { exitDemoMode, getDemoType, getDemoTypeLabel, isDemoMode } from '@/lib/demo'
import { FlaskConical, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function DemoBanner() {
    const [isDemo, setIsDemo] = useState(false)
    const [demoLabel, setDemoLabel] = useState<{ title: string; emoji: string } | null>(null)
    const [exiting, setExiting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const demo = isDemoMode()
        setIsDemo(demo)
        if (demo) {
            const type = getDemoType()
            if (type) {
                const label = getDemoTypeLabel(type)
                setDemoLabel({ title: label.title, emoji: label.emoji })
            }
        }
    }, [])

    if (!isDemo) return null

    const handleExit = async () => {
        setExiting(true)
        const success = await exitDemoMode()
        if (success) {
            // Redirect to landing page
            navigate('/', { replace: true })
            window.location.reload()
        }
        setExiting(false)
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 text-white px-4 py-2 shadow-lg">
            <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                        <FlaskConical className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                            Demo {demoLabel && <span>{demoLabel.emoji} {demoLabel.title}</span>}
                        </span>
                    </div>
                    <p className="text-sm hidden sm:block">
                        Explore with sample data. Your changes won't be saved.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExit}
                    disabled={exiting}
                    className="gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
                >
                    <X className="h-3 w-3" />
                    <span className="hidden sm:inline">{exiting ? 'Exiting...' : 'Exit Demo'}</span>
                </Button>
            </div>
        </div>
    )
}

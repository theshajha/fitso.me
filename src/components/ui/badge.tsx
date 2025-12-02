import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground",
                secondary: "border-transparent bg-secondary text-secondary-foreground",
                destructive: "border-transparent bg-destructive text-destructive-foreground",
                outline: "text-foreground",
                new: "border-transparent bg-emerald-500/10 text-emerald-600",
                good: "border-transparent bg-blue-500/10 text-blue-500",
                aging: "border-transparent bg-amber-500/10 text-amber-500",
                old: "border-transparent bg-red-500/10 text-red-500",
                warning: "border-transparent bg-amber-500/10 text-amber-500",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }


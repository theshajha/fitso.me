import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function getItemAge(purchaseDate: string | null | undefined): {
    years: number;
    months: number;
    label: string;
    status: "new" | "good" | "aging" | "old";
} {
    if (!purchaseDate) {
        return { years: 0, months: 0, label: "Unknown", status: "good" };
    }

    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffMs = now.getTime() - purchase.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    let label = "";
    if (years > 0) {
        label = `${years}y${months > 0 ? ` ${months}m` : ""}`;
    } else if (months > 0) {
        label = `${months}m`;
    } else {
        label = "New";
    }

    let status: "new" | "good" | "aging" | "old" = "good";
    if (years >= 5) status = "old";
    else if (years >= 3) status = "aging";
    else if (years === 0 && months < 6) status = "new";

    return { years, months, label, status };
}

export const CATEGORIES = [
    { id: "clothing", name: "Clothing", icon: "Shirt" },
    { id: "accessories", name: "Accessories", icon: "Watch" },
    { id: "gadgets", name: "Gadgets", icon: "Laptop" },
    { id: "bags", name: "Bags", icon: "Briefcase" },
    { id: "footwear", name: "Footwear", icon: "Footprints" },
] as const;

export const SUBCATEGORIES: Record<string, string[]> = {
    clothing: [
        "T-Shirts",
        "Shirts",
        "Pants",
        "Shorts",
        "Jackets",
        "Hoodies",
        "Sweaters",
        "Underwear",
        "Socks",
        "Swimwear",
        "Suits",
        "Dresses",
        "Skirts",
    ],
    accessories: [
        "Watches",
        "Belts",
        "Sunglasses",
        "Hats",
        "Scarves",
        "Jewelry",
        "Wallets",
        "Ties",
    ],
    gadgets: [
        "Laptops",
        "Phones",
        "Tablets",
        "Chargers",
        "Cables",
        "Headphones",
        "Cameras",
        "Power Banks",
    ],
    bags: ["Backpacks", "Suitcases", "Messenger Bags", "Duffel Bags", "Totes", "Pouches"],
    footwear: ["Sneakers", "Formal Shoes", "Sandals", "Boots", "Slippers", "Sports Shoes"],
};

export const CONDITIONS = [
    { id: "new", name: "New", color: "#10b981" },
    { id: "good", name: "Good", color: "#3b82f6" },
    { id: "worn", name: "Worn", color: "#f59e0b" },
    { id: "needs-replacement", name: "Needs Replacement", color: "#ef4444" },
] as const;

export const CLIMATES = [
    { id: "hot", name: "Hot Weather" },
    { id: "cold", name: "Cold Weather" },
    { id: "all-weather", name: "All Weather" },
] as const;

export const OCCASIONS = [
    { id: "casual", name: "Casual" },
    { id: "formal", name: "Formal" },
    { id: "sports", name: "Sports" },
    { id: "travel", name: "Travel" },
    { id: "outdoor", name: "Outdoor" },
] as const;

export const LOCATIONS = [
    { id: "home", name: "Home" },
    { id: "suitcase", name: "Suitcase" },
    { id: "backpack", name: "Backpack" },
    { id: "storage", name: "Storage" },
    { id: "laundry", name: "Laundry" },
] as const;

// Size types based on category/subcategory
export type SizeType = 'letter' | 'numeric' | 'waist-inseam' | 'shoe' | 'dimensions' | 'watch' | 'none';

export const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;
export const NUMERIC_SIZES = ['36', '38', '40', '42', '44', '46', '48', '50'] as const;
export const SHOE_SYSTEMS = [
    { id: 'us', name: 'US' },
    { id: 'uk', name: 'UK' },
    { id: 'eu', name: 'EU' },
] as const;

// Determine what size input to show based on category and subcategory
export function getSizeType(category: string, subcategory?: string): SizeType {
    if (category === 'footwear') return 'shoe';

    if (category === 'clothing') {
        const bottomsSubcategories = ['Pants', 'Shorts', 'Jeans', 'Skirts'];
        if (subcategory && bottomsSubcategories.includes(subcategory)) {
            return 'waist-inseam';
        }
        // Tops and other clothing
        return 'letter';
    }

    if (category === 'accessories') {
        if (subcategory === 'Watches') return 'watch';
        if (subcategory === 'Belts') return 'numeric';
        return 'none';
    }

    if (category === 'bags') return 'dimensions';

    if (category === 'gadgets') {
        if (subcategory && ['Laptops', 'Tablets', 'Phones'].includes(subcategory)) {
            return 'dimensions';
        }
        return 'none';
    }

    return 'none';
}

// Format size for display
export function formatSize(sizeData: SizeInfo | null | undefined): string {
    if (!sizeData) return '—';

    switch (sizeData.type) {
        case 'letter':
        case 'numeric':
            return sizeData.value || '—';
        case 'waist-inseam':
            if (sizeData.waist && sizeData.inseam) {
                return `${sizeData.waist}×${sizeData.inseam}`;
            }
            return sizeData.waist || sizeData.inseam || '—';
        case 'shoe':
            if (sizeData.value && sizeData.system) {
                return `${sizeData.system.toUpperCase()} ${sizeData.value}`;
            }
            return sizeData.value || '—';
        case 'watch':
            return sizeData.value ? `${sizeData.value}mm` : '—';
        case 'dimensions':
            if (sizeData.dimensions) {
                const { length, width, height } = sizeData.dimensions;
                if (length && width && height) {
                    return `${length}×${width}×${height}cm`;
                }
                if (sizeData.capacity) {
                    return `${sizeData.capacity}L`;
                }
            }
            if (sizeData.screenSize) {
                return `${sizeData.screenSize}"`;
            }
            return '—';
        default:
            return '—';
    }
}

export interface SizeInfo {
    type: SizeType;
    value?: string;
    waist?: string;
    inseam?: string;
    system?: string; // for shoes: us, uk, eu
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    capacity?: number; // for bags in liters
    screenSize?: number; // for gadgets in inches
}

// Storage estimation utilities
export function estimateBase64Size(base64String: string): number {
    // Remove data URL prefix if present
    const base64Data = base64String.split(',')[1] || base64String;
    // Base64 string length * 0.75 gives approximate byte size
    return Math.round(base64Data.length * 0.75);
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Image utilities
export function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Currency formatting
export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const;

export function formatCurrency(amount: number, currency: string = 'USD'): string {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;

    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}


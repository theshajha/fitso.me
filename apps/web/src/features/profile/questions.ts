import type { Door } from "@fitso/core";
import { DEFAULT_INR_PER_USD } from "@/lib/pricing";

/** The five answers (spec section 9). Values are what we store; labels are what we show. */
export type Option = { value: string; label: string; hint?: string };

const usd = (inr: number) => Math.round(inr / DEFAULT_INR_PER_USD);

export const LIFE: Option[] = [
  { value: "office", label: "Office" },
  { value: "hybrid", label: "Hybrid" },
  { value: "outdoors", label: "Outdoors" },
  { value: "creative", label: "Creative" },
  { value: "student", label: "Student" },
];

export const CLIMATE: Option[] = [
  { value: "hot and humid", label: "Hot and humid" },
  { value: "hot and dry", label: "Hot and dry" },
  { value: "four seasons", label: "Four seasons" },
  { value: "mostly cool", label: "Mostly cool" },
];

export const OCCASIONS: Option[] = [
  { value: "weddings and festive", label: "Weddings and festive" },
  { value: "dates and evenings", label: "Dates and evenings" },
  { value: "travel", label: "Travel" },
  { value: "gym and casual", label: "Gym and casual" },
  { value: "formal work", label: "Formal work" },
];

export const BUDGET: Option[] = [
  { value: "under 1,500", label: "Under ₹1,500", hint: `about $${usd(1500)}` },
  { value: "1,500 to 4,000", label: "₹1,500 to ₹4,000", hint: `about $${usd(1500)} to $${usd(4000)}` },
  { value: "4,000 to 10,000", label: "₹4,000 to ₹10,000", hint: `about $${usd(4000)} to $${usd(10000)}` },
  { value: "above 10,000", label: "Above ₹10,000", hint: `about $${usd(10000)}+` },
];

export const VIBE: Record<Door, Option[]> = {
  men: [
    { value: "clean and minimal", label: "Clean and minimal" },
    { value: "relaxed and easy", label: "Relaxed and easy" },
    { value: "sharp and tailored", label: "Sharp and tailored" },
    { value: "bold and expressive", label: "Bold and expressive" },
  ],
  women: [
    { value: "polished", label: "Polished" },
    { value: "relaxed", label: "Relaxed" },
    { value: "romantic", label: "Romantic" },
    { value: "bold", label: "Bold" },
    { value: "classic", label: "Classic" },
  ],
};

export const QUESTION_COPY = {
  life: "Where do your clothes need to work?",
  climate: "What is the weather like where you live?",
  occasions: "What do you dress for? Pick all that apply.",
  budget_per_item: "What do you usually spend per item?",
  vibe: "Which one sounds most like you?",
  door: "Which stylist should read you?",
  heritage: "Where are your roots?",
} as const;

export const HERITAGE_HINT = "Optional. It helps us read your colouring and use clothes you recognise.";
export const PHOTO_COUNT_LINE =
  "One photo is enough. Two to four, in different light or outfits, make the read sharper.";
export const MAX_PHOTOS = 4;

export const MAX_SELFIE_BYTES = 6 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const HEADLINES: Record<string, string> = {
  "colour-season": "Find your season",
  "style-archetype": "Find your archetype",
  "does-this-suit-me": "Check it against your face first",
};
export const DEFAULT_HEADLINE = "Let's look at you.";

export function headlineFor(from: string | null | undefined): string {
  return (from && HEADLINES[from]) || DEFAULT_HEADLINE;
}

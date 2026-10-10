import type { Door } from "@fitso/core";

export type CalloutKind = "works" | "change";

export type Callout = {
  kind: CalloutKind;
  text: string;
  /** Pin position on the photo, in percent of its width and height. */
  x: number;
  y: number;
  /** Which side of the pin the chip sits on. */
  side: "left" | "right";
};

export type Person = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Read = {
  door: Door;
  person: Person;
  callouts: Callout[];
  /** The free result for this photo. */
  headline: string;
  /** Colour season, shown as a chip. */
  season: string;
  /** Style archetype, shown as a chip. */
  archetype: string;
  working: [string, string, string];
  change: string;
  palette: { name: string; hex: string }[];
  /** One real paragraph from each part of the report. */
  report: { title: string; body: string }[];
};

/*
 * The people below are AI-generated placeholders until real photos exist.
 * The text is the engine's free result for each photo (eval run, 10 Oct 2026); the full reports are in content/samples.
 */
export const READS: Record<Door, Read> = {
  women: {
    door: "women",
    person: {
      src: "/people/woman-1.jpg",
      alt: "A woman in a magenta satin shirt, black wide-leg trousers and black boots",
      width: 768,
      height: 1376,
    },
    callouts: [
      { kind: "works", text: "Magenta at your neckline", x: 46, y: 31, side: "left" },
      { kind: "works", text: "Wide leg on your longer legs", x: 42, y: 62, side: "left" },
      { kind: "change", text: "Gold hoops, not silver", x: 55, y: 20, side: "right" },
    ],
    headline: "Your colours are bright and warm.",
    season: "Bright spring",
    archetype: "Polished Ease",
    working: [
      "Saturated magenta at your neckline keeps your golden skin warm and matches your strong contrast.",
      "High-waisted wide-leg trousers mark your natural waist and stretch your longer legs.",
      "Your long centre-parted waves add soft width that suits your oval face.",
    ],
    change: "Swap your silver hoops, chain and rings for shiny gold ones. Gold carries your skin's honey glow into every outfit.",
    palette: [
      { name: "Poppy red", hex: "#e0303a" },
      { name: "Warm fuchsia", hex: "#d6266e" },
      { name: "Clear turquoise", hex: "#00a6a6" },
      { name: "Bright emerald", hex: "#009b5a" },
      { name: "Marigold", hex: "#f5a21b" },
      { name: "Bright coral", hex: "#ff6f5e" },
      { name: "Warm royal blue", hex: "#2457d6" },
      { name: "Warm violet", hex: "#8a3fb8" },
    ],
    report: [
      {
        title: "Your colouring",
        body: "Your skin is medium depth with a golden-brown, warm undertone, and there is no ashiness in your shadows. Your hair is near-black with warm brown glints, and your eyes are dark brown. That gives you medium contrast and makes you a deep autumn. Rich, warm, saturated shades like berry, oxblood, teal, rust and saffron light you up. Pale, icy or greyed colours wash out your warmth.",
      },
      {
        title: "What it says",
        body: "You like clean tailoring with one confident colour. You finish the look with jewellery rather than fuss. It reads put-together and modern without trying too hard. Nothing in the outfit is loud, but the berry tone gives it a clear point of view, and the silver keeps it personal.",
      },
      {
        title: "Fabrics",
        body: "Keep silk and satin-finish crepe: the soft drape and sheen bounce light toward your face. Add raw silk and fine cotton-silk for texture. Change the wool-crepe trousers for a fluid crepe in the same wide leg, so the drape below matches the drape above.",
      },
    ],
  },
  men: {
    door: "men",
    person: {
      src: "/people/man-1.jpg",
      alt: "A man in a tan overshirt, olive tee, dark denim and white sneakers",
      width: 768,
      height: 1376,
    },
    callouts: [
      { kind: "works", text: "Camel and olive near your face", x: 42, y: 30, side: "left" },
      { kind: "works", text: "Tapered dark jeans", x: 38, y: 66, side: "left" },
      { kind: "change", text: "Gold watch, not silver", x: 62, y: 50, side: "left" },
    ],
    headline: "Your colours are deep and warm.",
    season: "Deep autumn",
    archetype: "Clean Minimal",
    working: [
      "Camel overshirt and olive tee sit in your palette, keeping skin warm and healthy near your face.",
      "Your close beard line and tall quiff define your jaw and lengthen your oval face.",
      "Dark tapered jeans and white sneakers balance your broad shoulders and keep the base minimal.",
    ],
    change: "Swap the silver metal-bracelet watch for a gold-tone dial on cognac leather. It's the one cool note in your warm look.",
    palette: [
      { name: "Camel tan", hex: "#b08758" },
      { name: "Deep olive", hex: "#5e6340" },
      { name: "Rust terracotta", hex: "#a0522d" },
      { name: "Chocolate brown", hex: "#5a3a26" },
      { name: "Deep teal", hex: "#1f5a5a" },
      { name: "Burnt ochre", hex: "#b5832e" },
      { name: "Oxblood", hex: "#5e1f24" },
      { name: "Forest green", hex: "#2f4a35" },
    ],
    report: [
      {
        title: "Your face",
        body: "Your face is oval. You have strong, dark, straight brows, a clean full hairline and a defined jaw under the beard. The brows and jaw lead, so you can carry structure. Use a semi-spread or spread collar for formal work, a camp collar for evenings, a crew or open collar like today.",
      },
      {
        title: "What it says",
        body: "Right now it says relaxed, put-together and warm. You know which colours work on you and you like good basics. There is a slight rugged, weekend edge from the selvedge cuffs, the rolled sleeves and the wooden beads. For formal work and dates, you can tidy it so the message is sharper.",
      },
      {
        title: "Details",
        body: "Keep the steel watch as your only accessory; a brown leather strap would add warmth for formal work. Change the dark socks with white sneakers for no-show socks, so the line from hem to shoe stays unbroken. Keep the bead bracelet for weekends and drop it for work and dates.",
      },
    ],
  },
};

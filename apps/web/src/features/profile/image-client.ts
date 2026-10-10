"use client";

/** Browser-side image prep: resize to 1024px on the long edge, JPEG 0.85. */
export const MAX_EDGE = 1024;
const QUALITY = 0.85;
/** Mean luminance (0 to 255) under this reads as too dark for a colour read. */
const TOO_DARK = 45;

export type PreparedImage = { blob: Blob; previewUrl: string; tooDark: boolean };

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", QUALITY),
  );
}

function meanLuminance(canvas: HTMLCanvasElement): number {
  const w = 48;
  const h = Math.max(1, Math.round((canvas.height / canvas.width) * w));
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const ctx = small.getContext("2d");
  if (!ctx) return 255;
  ctx.drawImage(canvas, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  return sum / (data.length / 4);
}

export type ImageSource = Blob | HTMLVideoElement;

export async function prepareImage(source: ImageSource): Promise<PreparedImage> {
  let width: number;
  let height: number;
  let draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth;
    height = source.videoHeight;
    draw = (ctx, w, h) => ctx.drawImage(source, 0, 0, w, h);
  } else {
    const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
    width = bitmap.width;
    height = bitmap.height;
    draw = (ctx, w, h) => {
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
    };
  }
  if (!width || !height) throw new Error("empty image");
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  draw(ctx, w, h);
  const tooDark = meanLuminance(canvas) < TOO_DARK;
  const blob = await canvasToBlob(canvas);
  return { blob, previewUrl: URL.createObjectURL(blob), tooDark };
}

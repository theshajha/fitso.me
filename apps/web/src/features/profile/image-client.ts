"use client";

/** Browser-side image prep: resize to 1600px on the long edge, JPEG 0.85. */
export const MAX_EDGE = 1600;
/** Face close-ups are cut from the original at up to this size. */
const CROP_EDGE = 1024;
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

export type FaceBox = { x: number; y: number; w: number; h: number };

/**
 * Cut a face close-up from the original image. The box is in fractions of the
 * image; it is padded so hair, neck and shoulders come along. Returns null when
 * the face is already large in the frame (no crop needed).
 */
export async function cropFace(source: ImageSource, box: FaceBox, pad = 0.9): Promise<Blob | null> {
  if (box.w >= 0.35) return null;
  let width: number;
  let height: number;
  let draw: (ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, dw: number, dh: number) => void;
  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth;
    height = source.videoHeight;
    draw = (ctx, sx, sy, sw, sh, dw, dh) => ctx.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh);
  } else {
    const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
    width = bitmap.width;
    height = bitmap.height;
    draw = (ctx, sx, sy, sw, sh, dw, dh) => {
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
      bitmap.close();
    };
  }
  if (!width || !height) return null;
  const cx = (box.x + box.w / 2) * width;
  const cy = (box.y + box.h / 2) * height;
  const side = Math.max(box.w * width, box.h * height) * (1 + pad * 2);
  const sx = Math.max(0, Math.round(cx - side / 2));
  const sy = Math.max(0, Math.round(cy - side * 0.45));
  const sw = Math.min(width - sx, Math.round(side));
  const sh = Math.min(height - sy, Math.round(side * 1.1));
  if (sw < 120 || sh < 120) return null;
  const scale = Math.min(1, CROP_EDGE / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx, sx, sy, sw, sh, canvas.width, canvas.height);
  return canvasToBlob(canvas);
}

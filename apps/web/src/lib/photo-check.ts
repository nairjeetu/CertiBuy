export interface PhotoCheckResult {
  ok: boolean;
  brightness: number;
  width: number;
  height: number;
  reason?: string;
}

export async function checkPhoto(
  file: File,
  minPx: number,
  minBrightness: number,
): Promise<PhotoCheckResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (width < minPx || height < minPx) {
        resolve({ ok: false, brightness: 0, width, height, reason: `Photo must be at least ${minPx}×${minPx} pixels.` });
        return;
      }

      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 200 / Math.max(width, height));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let total = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
      }
      const brightness = Math.round(total / pixels);

      if (brightness < minBrightness) {
        resolve({ ok: false, brightness, width, height, reason: `Photo is too dark (brightness ${brightness}, minimum ${minBrightness}).` });
        return;
      }

      resolve({ ok: true, brightness, width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, brightness: 0, width: 0, height: 0, reason: "Could not read image." });
    };

    img.src = url;
  });
}

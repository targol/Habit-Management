/**
 * Image processing utilities for Javaneh app.
 * Enforces strict size and dimension limits on uploaded images
 * to keep LocalStorage, IndexedDB and backups lightweight (< 50KB per avatar).
 */

export interface ImageProcessingResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

export const MAX_ALLOWED_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB raw limit
export const MAX_AVATAR_DIMENSION = 256; // Max 256x256 px
export const JPEG_COMPRESSION_QUALITY = 0.8; // High visual quality with tiny size

/**
 * Validates and compresses an uploaded image file.
 * Automatically downscales to max 256x256 and compresses to JPEG ~20-40KB.
 */
export async function processAndCompressImage(
  file: File,
  maxDimension = MAX_AVATAR_DIMENSION,
  quality = JPEG_COMPRESSION_QUALITY
): Promise<ImageProcessingResult> {
  // 1. File type verification
  if (!file.type.startsWith('image/')) {
    throw new Error('فایل انتخاب‌شده یک تصویر معتبر (JPG, PNG, WebP) نیست.');
  }

  // 2. Strict initial size limit
  if (file.size > MAX_ALLOWED_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`حجم فایل (${sizeMb} مگابایت) بیش از سقف مجاز ۵ مگابایت است. لطفاً عکس سبک‌تری انتخاب کنید.`);
  }

  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('خطا در خواندن فایل از حافظه دستگاه.'));
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('بارگذاری و رمزگشایی تصویر با خطا مواجه شد.'));
      };

      img.onload = () => {
        try {
          // Calculate proportional downscaling
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          // Render onto offscreen canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('عدم دسترسی به بستر پردازش گرافیکی مرورگر.');
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Calculate final payload size
          const head = 'data:image/jpeg;base64,';
          const base64Len = dataUrl.length - head.length;
          const compressedSizeBytes = Math.round((base64Len * 3) / 4);
          const compressedSizeKb = Math.max(1, Math.round(compressedSizeBytes / 1024));

          resolve({
            dataUrl,
            originalSizeKb,
            compressedSizeKb,
            width,
            height,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('خطای ناشناخته در فشرده‌سازی تصویر.'));
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

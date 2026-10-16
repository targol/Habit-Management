export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number;
  percent: number;
}

export interface ApkDownloadResult {
  success: boolean;
  error?: string;
  isPwaRecommended?: boolean;
}

export async function checkApkAvailability(): Promise<{ available: boolean; size?: number; formattedSize?: string; error?: string }> {
  try {
    const res = await fetch(`/api/apk-info?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.available) {
        return { available: true, size: data.size, formattedSize: data.formattedSize };
      }
    }
  } catch {}
  return { 
    available: false, 
    error: 'فایل APK مستقیم روی سرور وب موجود نیست؛ برنامه جوانه یک وب‌اپلیکیشن استاندارد (PWA) است و مستقیماً روی صفحه گوشی نصب می‌شود.' 
  };
}

export async function downloadApkBlobSecure(
  onProgress?: (progress: DownloadProgress) => void
): Promise<ApkDownloadResult> {
  try {
    const cacheBuster = `v=1.5.0&t=${Date.now()}`;
    const candidateUrls = [
      `/javaneh.apk?${cacheBuster}`,
      `/api/download-apk?${cacheBuster}`,
    ];
    let response: Response | null = null;

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        const cType = res.headers.get('content-type') || '';
        // Strict validation: Must not be HTML or JSON
        if (res.ok && !cType.includes('text/html') && !cType.includes('application/json')) {
          response = res;
          break;
        }
      } catch {}
    }

    if (!response || !response.ok) {
      return {
        success: false,
        isPwaRecommended: true,
        error: 'فایل نصبی APK روی سرور وب میزبانی نشده است. جوانه یک وب‌اپلیکیشن (PWA) است؛ لطفاً از گزینه «نصب برنامه روی گوشی» استفاده کنید.',
      };
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    // Reject anything suspiciously small (like an error page under 50KB)
    if (totalBytes > 0 && totalBytes < 50000) {
      return {
        success: false,
        isPwaRecommended: true,
        error: 'فایل دریافتی یک بسته معتبر اندروید نیست. لطفاً از گزینه نصب PWA استفاده نمایید.',
      };
    }

    if (!response.body) {
      const blob = await response.blob();
      if (blob.size < 50000 || blob.type.includes('text/html')) {
        return {
          success: false,
          isPwaRecommended: true,
          error: 'فایل دریافتی معتبر نیست. لطفاً از گزینه نصب PWA استفاده کنید.',
        };
      }
      triggerBlobSave(blob, 'javaneh.apk');
      return { success: true };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        if (onProgress && totalBytes > 0) {
          const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
          onProgress({ receivedBytes, totalBytes, percent });
        }
      }
    }

    // Verify ZIP magic bytes (0x50, 0x4B)
    if (chunks.length > 0 && chunks[0].length >= 2) {
      if (chunks[0][0] !== 0x50 || chunks[0][1] !== 0x4B) {
        return {
          success: false,
          isPwaRecommended: true,
          error: 'قالب فایل دانلود شده با پکیج نصبی اندروید (APK) مطابقت ندارد. از نصب سریع PWA استفاده فرمایید.',
        };
      }
    }

    if (receivedBytes < 50000) {
      return {
        success: false,
        isPwaRecommended: true,
        error: 'حجم فایل دریافتی ناقص است. لطفاً از نصب مستقیم وب‌اپلیکیشن (PWA) استفاده کنید.',
      };
    }

    const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
    triggerBlobSave(blob, 'javaneh.apk');
    return { success: true };
  } catch (err: any) {
    console.error('APK Download error:', err);
    return { 
      success: false, 
      isPwaRecommended: true,
      error: err?.message || 'خطا در دانلود بسته نصبی' 
    };
  }
}

function triggerBlobSave(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}


export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number;
  percent: number;
}

export interface ApkDownloadResult {
  success: boolean;
  error?: string;
}

export async function downloadApkBlobSecure(
  onProgress?: (progress: DownloadProgress) => void
): Promise<ApkDownloadResult> {
  try {
    const candidateUrls = ['/javaneh.apk', './javaneh.apk', '/api/download-apk'];
    let response: Response | null = null;

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          response = res;
          break;
        }
      } catch {}
    }

    if (!response || !response.ok) {
      throw new Error('فایل نصبی در دسترس نیست. لطفاً مجدداً تلاش کنید.');
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 547128;

    if (!response.body) {
      const blob = await response.blob();
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
        if (onProgress) {
          const percent = totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : 50;
          onProgress({ receivedBytes, totalBytes, percent });
        }
      }
    }

    const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
    triggerBlobSave(blob, 'javaneh.apk');
    return { success: true };
  } catch (err: any) {
    console.error('APK Download failed:', err);
    return { success: false, error: err?.message || 'خطا در دانلود فایل' };
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

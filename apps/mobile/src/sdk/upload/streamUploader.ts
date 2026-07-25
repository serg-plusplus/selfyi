// SDK 54 shipped a new expo-file-system API; the resumable upload task
// (createUploadTask / FileSystemUploadType) lives in the legacy module.
import * as FileSystem from "expo-file-system/legacy";

export interface UploadOptions {
  uploadUrl: string;
  fileUri: string;
  onProgress?: (pct: number) => void;
}

/**
 * Upload a local file to a Stream direct-upload URL (mobile spec §4.5). Uses
 * expo-file-system's multipart upload; fine for <200MB single-request uploads
 * (a 60s 1080p clip). Larger / resumable would need a TUS client (out of v1).
 */
export async function uploadToStream({ uploadUrl, fileUri, onProgress }: UploadOptions): Promise<void> {
  const task = FileSystem.createUploadTask(
    uploadUrl,
    fileUri,
    {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "file",
    },
    (p) => {
      if (p.totalBytesExpectedToSend > 0) {
        onProgress?.(p.totalBytesSent / p.totalBytesExpectedToSend);
      }
    },
  );

  const res = await task.uploadAsync();
  if (!res || res.status < 200 || res.status >= 300) {
    throw new Error(`Upload failed: ${res?.status ?? "no response"}`);
  }
}

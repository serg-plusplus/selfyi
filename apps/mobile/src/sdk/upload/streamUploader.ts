import * as FileSystem from "expo-file-system/legacy";

export interface UploadOptions {
  uploadUrl: string;
  fileUri: string;
  onProgress?: (pct: number) => void;
}

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

// Storage abstraction layer
// Supports: Google Drive, DigitalOcean Spaces, AWS S3, or local file system

export type StorageProvider = "google-drive" | "spaces" | "s3" | "local";

export interface StorageConfig {
  provider: StorageProvider;
  // Google Drive
  googleDriveFolderId?: string;
  googleDriveCredentials?: string;

  // Spaces/S3
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;

  // Local
  localPath?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  provider: StorageProvider;
}

class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async uploadFile(file: File, filename: string): Promise<UploadResult> {
    switch (this.config.provider) {
      case "google-drive":
        return this.uploadToGoogleDrive(file, filename);
      case "spaces":
      case "s3":
        return this.uploadToS3(file, filename);
      case "local":
        return this.uploadToLocal(file, filename);
      default:
        throw new Error(
          `Unsupported storage provider: ${this.config.provider}`
        );
    }
  }

  private async uploadToGoogleDrive(
    file: File,
    filename: string
  ): Promise<UploadResult> {
    // This will be implemented via API route for security
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);

    const response = await fetch("/api/upload/google-drive", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload to Google Drive");
    }

    const data = await response.json();
    return {
      url: data.url,
      key: data.id,
      provider: "google-drive",
    };
  }

  private async uploadToS3(
    file: File,
    filename: string
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);

    const response = await fetch("/api/upload/s3", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload to S3/Spaces");
    }

    const data = await response.json();
    return {
      url: data.url,
      key: data.key,
      provider: this.config.provider,
    };
  }

  private async uploadToLocal(
    file: File,
    filename: string
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);

    const response = await fetch("/api/upload/local", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload locally");
    }

    const data = await response.json();
    return {
      url: data.url,
      key: data.key,
      provider: "local",
    };
  }

  getFileUrl(key: string): string {
    // This will be handled by the API routes
    return `/api/files/${key}`;
  }
}

// Singleton instance
let storageInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageInstance) {
    const provider = (process.env.STORAGE_PROVIDER ||
      "local") as StorageProvider;

    const config: StorageConfig = {
      provider,
      googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      googleDriveCredentials: process.env.GOOGLE_DRIVE_CREDENTIALS,
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION,
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      bucket: process.env.STORAGE_BUCKET,
      localPath: process.env.LOCAL_UPLOAD_PATH || "./public/uploads",
    };

    storageInstance = new StorageService(config);
  }

  return storageInstance;
}

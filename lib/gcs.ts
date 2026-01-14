import { Storage, Bucket } from '@google-cloud/storage';
import prisma from './prisma';
import { decrypt } from './encryption';

interface GCSCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  bucketName: string;
}

// Cache for credentials to avoid repeated DB queries
let credentialsCache: GCSCredentials | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// Cache for storage client
let storageClient: Storage | null = null;
let bucketClient: Bucket | null = null;

export async function getGCSCredentials(): Promise<GCSCredentials> {
  // Check cache
  if (credentialsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return credentialsCache;
  }

  // Try database first
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'gcs_project_id',
          'gcs_client_email',
          'gcs_private_key',
          'gcs_bucket_name',
        ],
      },
    },
  });

  const settingsMap = settings.reduce(
    (acc, s) => {
      acc[s.key] = s.value;
      return acc;
    },
    {} as Record<string, string>
  );

  // If database has credentials, use them (with decryption for private key)
  if (
    settingsMap.gcs_project_id &&
    settingsMap.gcs_client_email &&
    settingsMap.gcs_private_key &&
    settingsMap.gcs_bucket_name
  ) {
    credentialsCache = {
      projectId: settingsMap.gcs_project_id,
      clientEmail: settingsMap.gcs_client_email,
      privateKey: decrypt(settingsMap.gcs_private_key),
      bucketName: settingsMap.gcs_bucket_name,
    };
    cacheTimestamp = Date.now();
    // Reset storage client to use new credentials
    storageClient = null;
    bucketClient = null;
    return credentialsCache;
  }

  // Fallback to environment variables
  if (
    process.env.GCS_PROJECT_ID &&
    process.env.GCS_CLIENT_EMAIL &&
    process.env.GCS_PRIVATE_KEY &&
    process.env.GCS_BUCKET_NAME
  ) {
    credentialsCache = {
      projectId: process.env.GCS_PROJECT_ID,
      clientEmail: process.env.GCS_CLIENT_EMAIL,
      privateKey: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      bucketName: process.env.GCS_BUCKET_NAME,
    };
    cacheTimestamp = Date.now();
    return credentialsCache;
  }

  throw new Error('Google Cloud Storage credentials not configured');
}

// Export function to invalidate cache (used after configuration changes)
export function invalidateGCSCache() {
  credentialsCache = null;
  cacheTimestamp = 0;
  storageClient = null;
  bucketClient = null;
}

async function getStorageClient(): Promise<Storage> {
  if (storageClient) {
    return storageClient;
  }

  const credentials = await getGCSCredentials();

  storageClient = new Storage({
    projectId: credentials.projectId,
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
  });

  return storageClient;
}

async function getBucket(): Promise<Bucket> {
  if (bucketClient) {
    return bucketClient;
  }

  const credentials = await getGCSCredentials();
  const storage = await getStorageClient();
  bucketClient = storage.bucket(credentials.bucketName);

  return bucketClient;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder?: string
): Promise<UploadResult> {
  try {
    const bucket = await getBucket();
    const credentials = await getGCSCredentials();

    // Create a unique file name with optional folder prefix
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder
      ? `${folder}/${timestamp}-${sanitizedName}`
      : `${timestamp}-${sanitizedName}`;

    const file = bucket.file(filePath);

    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${credentials.bucketName}/${filePath}`;

    console.log(`File uploaded successfully: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
      fileName: filePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to upload file:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(fileName: string): Promise<DeleteResult> {
  try {
    const bucket = await getBucket();
    const file = bucket.file(fileName);

    await file.delete();

    console.log(`File deleted successfully: ${fileName}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete file:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate a signed URL for temporary access to a file
 */
export async function getSignedUrl(
  fileName: string,
  expiresInMinutes: number = 60
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const bucket = await getBucket();
    const file = bucket.file(fileName);

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return { success: true, url };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to generate signed URL:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * List files in a folder
 */
export async function listFiles(
  folder?: string,
  maxResults: number = 100
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const bucket = await getBucket();

    const [files] = await bucket.getFiles({
      prefix: folder ? `${folder}/` : undefined,
      maxResults,
    });

    const fileNames = files.map((file) => file.name);

    return { success: true, files: fileNames };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to list files:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if the GCS connection is working
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const bucket = await getBucket();

    // Try to get bucket metadata to verify connection
    await bucket.getMetadata();

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('GCS connection test failed:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

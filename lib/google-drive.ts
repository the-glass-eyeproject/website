import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// In serverless environments (like Vercel), use /tmp for writable storage
// Otherwise use project data directory
export function getTokenPath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Serverless environment - use /tmp
    return '/tmp/google-token.json';
  }
  return path.join(process.cwd(), 'data', 'google-token.json');
}

const TOKEN_PATH = getTokenPath();
const CREDENTIALS_PATH = path.join(process.cwd(), 'data', 'google-credentials.json');

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// OAuth2 client
export function getOAuth2Client(config: GoogleDriveConfig) {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

// Get stored tokens
export function getStoredTokens(): { access_token?: string; refresh_token?: string; expiry_date?: number } | null {
  try {
    const tokenPath = getTokenPath();
    if (fs.existsSync(tokenPath)) {
      const tokenData = fs.readFileSync(tokenPath, 'utf-8');
      return JSON.parse(tokenData);
    }
  } catch (error) {
    console.error('Error reading tokens:', error);
  }
  return null;
}

// Store tokens
export function storeTokens(tokens: any): void {
  try {
    const tokenPath = getTokenPath();
    const dataDir = path.dirname(tokenPath);
    
    // Only create directory if it doesn't exist and we're not in /tmp
    if (!fs.existsSync(dataDir) && !tokenPath.startsWith('/tmp')) {
      fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 }); // Restrictive permissions
    }
    
    // Write with restrictive permissions (owner read/write only)
    // In /tmp, we can't set custom permissions, so just write normally
    if (tokenPath.startsWith('/tmp')) {
      fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    } else {
      fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    }
  } catch (error) {
    console.error('Error storing tokens:', error);
    // In serverless, tokens in /tmp are ephemeral - this is expected
    if (process.env.VERCEL) {
      console.warn('Note: Tokens stored in /tmp are ephemeral in Vercel. Consider using a database or Vercel KV for persistent storage.');
    }
  }
}

// Get authenticated Drive client
export async function getDriveClient(): Promise<any> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google Drive credentials not configured');
  }

  const oauth2Client = getOAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });

  const tokens = getStoredTokens();
  if (!tokens || !tokens.access_token) {
    throw new Error('Not authenticated with Google Drive');
  }

  oauth2Client.setCredentials(tokens);

  // Check if token is expired and refresh if needed
  // Access tokens typically expire after 1 hour
  if (tokens.expiry_date && tokens.refresh_token) {
    const now = Date.now();
    const expiryTime = tokens.expiry_date;
    
    // Refresh if token expires in less than 5 minutes
    if (now >= expiryTime - 5 * 60 * 1000) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials) {
          storeTokens(credentials);
          oauth2Client.setCredentials(credentials);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        // If refresh fails, try to use existing token anyway
      }
    }
  }

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Create folder if it doesn't exist
export async function getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const drive = await getDriveClient();

  // Search for existing folder
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  const searchResponse = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    return searchResponse.data.files[0].id!;
  }

  // Create new folder
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentFolderId && { parents: [parentFolderId] }),
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return folder.data.id!;
}

// Upload file to Google Drive
export async function uploadFileToDrive(
  file: Buffer,
  filename: string,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  const drive = await getDriveClient();

  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };

  // Convert Buffer to stream for Google Drive API
  const stream = Readable.from(file);

  const media = {
    mimeType,
    body: stream,
  };

  const uploadedFile = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink, webContentLink',
  });

  // Make file publicly viewable
  await drive.permissions.create({
    fileId: uploadedFile.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    id: uploadedFile.data.id!,
    webViewLink: uploadedFile.data.webViewLink || '',
    webContentLink: uploadedFile.data.webContentLink || '',
  };
}

// List all image files from Drive
export async function listAllPhotos(): Promise<Array<{
  id: string;
  name: string;
  webViewLink: string;
  thumbnailLink?: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
}>> {
  const drive = await getDriveClient();

  // Get all image files
  const imageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];

  const query = `(${imageMimeTypes.map(mt => `mimeType='${mt}'`).join(' or ')}) and trashed=false`;

  const files: any[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: query,
      fields: 'nextPageToken, files(id, name, webViewLink, thumbnailLink, parents, createdTime, modifiedTime)',
      pageSize: 1000,
      pageToken,
    });

    if (response.data.files) {
      files.push(...response.data.files);
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files.map(file => ({
    id: file.id!,
    name: file.name!,
    webViewLink: file.webViewLink || '',
    thumbnailLink: file.thumbnailLink || `https://drive.google.com/uc?export=view&id=${file.id}`,
    parents: file.parents,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
  }));
}

// Get folder name from folder ID
export async function getFolderName(folderId: string): Promise<string | null> {
  try {
    const drive = await getDriveClient();
    const response = await drive.files.get({
      fileId: folderId,
      fields: 'name',
    });
    return response.data.name || null;
  } catch {
    return null;
  }
}

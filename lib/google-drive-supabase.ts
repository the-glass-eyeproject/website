// Google Drive integration using Supabase for token storage
// Single shared Google Drive account with auto-refresh

import { google } from 'googleapis';
import { createServiceClient } from '@/lib/supabase/server';

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

// Get stored tokens from Supabase
export async function getStoredTokens(): Promise<{
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
} | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase not configured');
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('google_drive_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (error || !data) {
      return null;
    }

    // Convert expiry_date from ISO string to timestamp
    let expiryTimestamp: number | undefined;
    if (data.expiry_date) {
      expiryTimestamp = new Date(data.expiry_date).getTime();
    }

    return {
      access_token: data.access_token || undefined,
      refresh_token: data.refresh_token || undefined,
      expiry_date: expiryTimestamp,
    };
  } catch (error) {
    console.error('Error reading tokens from Supabase:', error);
    return null;
  }
}

// Store tokens in Supabase
export async function storeTokens(tokens: any): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase not configured. Cannot store tokens.');
    }

    const supabase = createServiceClient();
    
    // Convert expiry_date from timestamp to ISO string
    let expiryDate: string | null = null;
    if (tokens.expiry_date) {
      expiryDate = new Date(tokens.expiry_date).toISOString();
    }

    const { error } = await supabase
      .from('google_drive_tokens')
      .update({
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || '',
        expiry_date: expiryDate,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error storing tokens in Supabase:', error);
    throw error;
  }
}

// Get authenticated Drive client with auto-refresh
export async function getDriveClient(): Promise<any> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google Drive credentials not configured');
  }

  const oauth2Client = getOAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });

  // Get tokens from Supabase
  let tokens = await getStoredTokens();
  
  if (!tokens || !tokens.access_token) {
    throw new Error('Google Drive not connected. Please connect your Drive first.');
  }

  // Check if token needs refresh (expires in less than 5 minutes)
  const now = Date.now();
  const needsRefresh = tokens.expiry_date && 
    tokens.expiry_date <= (now + 5 * 60 * 1000);

  // Auto-refresh if needed
  if (needsRefresh && tokens.refresh_token) {
    try {
      oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (credentials) {
        // Update tokens in Supabase
        await storeTokens(credentials);
        tokens = {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokens.refresh_token,
          expiry_date: credentials.expiry_date 
            ? new Date(credentials.expiry_date).getTime() 
            : undefined,
        };
      }
    } catch (error) {
      console.error('Error auto-refreshing token:', error);
      // Continue with existing token if refresh fails
    }
  }

  // Set credentials and return Drive client
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Check if Google Drive is connected
export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase not configured. Google Drive connection check skipped.');
      return false;
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('google_drive_tokens')
      .select('access_token, refresh_token')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (error || !data) {
      return false;
    }

    // Check if tokens exist and are not empty
    return !!(
      data.access_token && 
      data.access_token !== '' &&
      data.refresh_token && 
      data.refresh_token !== ''
    );
  } catch (error) {
    // Silently return false if Supabase is not configured
    // This allows the app to work without Supabase (fallback to local storage)
    if (error instanceof Error && error.message.includes('Supabase environment variables')) {
      return false;
    }
    console.error('Error checking Google Drive connection:', error);
    return false;
  }
}

// Import and re-export folder/file management functions
// These use getDriveClient which now uses Supabase tokens
import { Readable } from 'stream';

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

// Get the 'photos' folder ID
export async function getPhotosFolderId(): Promise<string | null> {
  try {
    const drive = await getDriveClient();
    const response = await drive.files.list({
      q: "name='photos' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents",
      fields: 'files(id)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }
    return null;
  } catch (error) {
    console.error('Error getting photos folder:', error);
    return null;
  }
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

// List all image files from Drive within the photos folder structure
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

  // First, get the 'photos' folder ID
  const photosFolderId = await getPhotosFolderId();
  if (!photosFolderId) {
    // If photos folder doesn't exist, return empty array
    return [];
  }

  // Get all image files within the photos folder and its subfolders
  const imageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];

  const files: any[] = [];

  // Get all folders inside photos folder (these are tag folders)
  const foldersResponse = await drive.files.list({
    q: `'${photosFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  // Search for images in each tag folder
  if (foldersResponse.data.files && foldersResponse.data.files.length > 0) {
    for (const folder of foldersResponse.data.files) {
      const tagQuery = `(${imageMimeTypes.map(mt => `mimeType='${mt}'`).join(' or ')}) and trashed=false and '${folder.id}' in parents`;
      let tagPageToken: string | undefined;

      do {
        const tagResponse = await drive.files.list({
          q: tagQuery,
          fields: 'nextPageToken, files(id, name, webViewLink, thumbnailLink, parents, createdTime, modifiedTime)',
          pageSize: 1000,
          pageToken: tagPageToken,
        });

        if (tagResponse.data.files) {
          files.push(...tagResponse.data.files);
        }

        tagPageToken = tagResponse.data.nextPageToken || undefined;
      } while (tagPageToken);
    }
  }

  // Also check for images directly in the photos folder (for backwards compatibility)
  const directQuery = `(${imageMimeTypes.map(mt => `mimeType='${mt}'`).join(' or ')}) and trashed=false and '${photosFolderId}' in parents`;
  let directPageToken: string | undefined;

  do {
    const directResponse = await drive.files.list({
      q: directQuery,
      fields: 'nextPageToken, files(id, name, webViewLink, thumbnailLink, parents, createdTime, modifiedTime)',
      pageSize: 1000,
      pageToken: directPageToken,
    });

    if (directResponse.data.files) {
      files.push(...directResponse.data.files);
    }

    directPageToken = directResponse.data.nextPageToken || undefined;
  } while (directPageToken);

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

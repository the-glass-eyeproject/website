// Simple JSON-based database for photo metadata
// In production, you'd use a proper database like PostgreSQL, MongoDB, etc.

import fs from 'fs';
import path from 'path';

export interface Photo {
  id: string;
  filename: string;
  url: string;
  storageKey: string;
  storageProvider: string;
  tags: string[];
  uploadedAt: string;
  size?: number;
  width?: number;
  height?: number;
}

// In serverless environments (like Vercel), use /tmp for writable storage
// Otherwise use project data directory
const getDbPath = (): string => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Serverless environment - use /tmp
    return '/tmp/photos.json';
  }
  return path.join(process.cwd(), 'data', 'photos.json');
};

function ensureDbExists() {
  const dbPath = getDbPath();
  const dataDir = path.dirname(dbPath);
  
  // Only create directory if it doesn't exist and we're not in /tmp
  if (!fs.existsSync(dataDir) && !dbPath.startsWith('/tmp')) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
  }
}

export function getAllPhotos(): Photo[] {
  ensureDbExists();
  try {
    const dbPath = getDbPath();
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getPhotoById(id: string): Photo | null {
  const photos = getAllPhotos();
  return photos.find(p => p.id === id) || null;
}

export function getPhotosByTag(tag: string): Photo[] {
  const photos = getAllPhotos();
  return photos.filter(p => p.tags.includes(tag));
}

export function savePhoto(photo: Photo): void {
  ensureDbExists();
  const photos = getAllPhotos();
  const existingIndex = photos.findIndex(p => p.id === photo.id);
  
  if (existingIndex >= 0) {
    photos[existingIndex] = photo;
  } else {
    photos.push(photo);
  }
  
  const dbPath = getDbPath();
  fs.writeFileSync(dbPath, JSON.stringify(photos, null, 2));
}

export function deletePhoto(id: string): boolean {
  ensureDbExists();
  const photos = getAllPhotos();
  const filtered = photos.filter(p => p.id !== id);
  
  if (filtered.length === photos.length) {
    return false; // Photo not found
  }
  
  const dbPath = getDbPath();
  fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2));
  return true;
}

export function getAllTags(): string[] {
  const photos = getAllPhotos();
  const tagSet = new Set<string>();
  photos.forEach(photo => {
    photo.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

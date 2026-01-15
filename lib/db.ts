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

const DB_PATH = path.join(process.cwd(), 'data', 'photos.json');

function ensureDbExists() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
  }
}

export function getAllPhotos(): Photo[] {
  ensureDbExists();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
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
  
  fs.writeFileSync(DB_PATH, JSON.stringify(photos, null, 2));
}

export function deletePhoto(id: string): boolean {
  ensureDbExists();
  const photos = getAllPhotos();
  const filtered = photos.filter(p => p.id !== id);
  
  if (filtered.length === photos.length) {
    return false; // Photo not found
  }
  
  fs.writeFileSync(DB_PATH, JSON.stringify(filtered, null, 2));
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

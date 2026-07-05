import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

let gfs: GridFSBucket;

export function initGridFS() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB not connected');
  gfs = new GridFSBucket(db, { bucketName: 'uploads' });
}

export function getGridFS() {
  return gfs;
}

export async function saveToGridFS(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = gfs.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });
    uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
    uploadStream.on('error', reject);
    uploadStream.end(file.buffer);
  });
}

export async function deleteFromGridFS(fileId: string) {
  try {
    await gfs.delete(new ObjectId(fileId));
  } catch {}
}

const memoryStorage = multer.memoryStorage();

export const uploadPost = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

export const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

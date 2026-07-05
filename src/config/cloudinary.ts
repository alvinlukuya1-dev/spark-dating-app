import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'spark-images';

export async function saveToSupabase(file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return publicUrl;
}

export async function deleteFromSupabase(url: string) {
  const fileName = url.split('/').pop();
  if (!fileName) return;
  try { await supabase.storage.from(BUCKET).remove([fileName]); } catch {}
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

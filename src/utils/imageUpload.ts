import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

/**
 * Pick an image from the library and upload it to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
async function pickAndUploadImage(
  bucket: string,
  folder: string,
): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets[0].base64) {
    return null;
  }

  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop() || 'jpg';
  const fileName = `${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, decode(asset.base64), {
      contentType: asset.mimeType || `image/${ext}`,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Pick and upload a user avatar. Returns the public URL.
 */
export async function pickAndUploadAvatar(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return pickAndUploadImage('avatars', user.id);
}

/**
 * Pick and upload a club image. Returns the public URL.
 */
export async function pickAndUploadClubImage(clubId: string): Promise<string | null> {
  return pickAndUploadImage('club-images', clubId);
}

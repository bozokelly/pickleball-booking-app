import { supabase } from '@/lib/supabase';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadFeedImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('feed-images')
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('feed-images').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadClubImage(file: File, clubId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${clubId}/image.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('club-images')
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('club-images').getPublicUrl(filePath);
  return data.publicUrl;
}

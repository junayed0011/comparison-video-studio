import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: 'https://r5tj4fxt.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzAwMTV9.DhYCeJYTYv1w73Zy3E1lr4HCpTx1W4moQBqk32EuICA'
});

/**
 * Uploads a user avatar and returns the public URL
 */
export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}.${fileExt}`;

  const { data, error } = await insforge.storage
    .from('profiles')
    .upload(filePath, file);

  if (error) throw error;

  // Update profile record in database
  await insforge.database
    .from('profiles')
    .update({ avatar_url: data.url, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return data.url;
};

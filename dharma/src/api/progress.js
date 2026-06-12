import client from './client';

export async function fetchProgress() {
  const { data } = await client.get('/progress');
  return data; // { data, syncedAt }
}

export async function saveProgress(appData) {
  const { data } = await client.put('/progress', { data: appData });
  return data; // { syncedAt }
}

export async function updateProfile(updates) {
  const { data } = await client.put('/profile', updates);
  return data.user;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await client.put('/profile/password', { currentPassword, newPassword });
  return data;
}

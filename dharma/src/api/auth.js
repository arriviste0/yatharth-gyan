import client from './client';

export async function register(name, email, password) {
  const { data } = await client.post('/auth/register', { name, email, password });
  return data; // { token, user }
}

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  return data; // { token, user }
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me');
  return data.user;
}

export async function logout() {
  await client.post('/auth/logout').catch(() => {});
}

export async function loginWithGoogle(payload) {
  const body = typeof payload === 'string' ? { credential: payload } : payload;
  const { data } = await client.post('/auth/google', body);
  return data; // { token, user }
}

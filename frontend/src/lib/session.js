export const SESSION_KEY = 'session';
export const TOKEN_KEY = 'token';

export function saveSession(data) {
  const session = {
    token: data.token,
    user: data.user,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function readSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.expires || Date.now() > parsed.expires) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

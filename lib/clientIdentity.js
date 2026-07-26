const KEY = 'hola_user_id';

export function getUserId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `u_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(KEY, id);
  }
  return id;
}

const GUEST_MODE_KEY = 'guest_mode';

export function enableGuestMode() {
  sessionStorage.setItem(GUEST_MODE_KEY, 'true');
}

export function disableGuestMode() {
  sessionStorage.removeItem(GUEST_MODE_KEY);
}

export function isGuestMode(): boolean {
  return typeof window !== 'undefined' && sessionStorage.getItem(GUEST_MODE_KEY) === 'true';
}

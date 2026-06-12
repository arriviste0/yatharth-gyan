export function haptic(pattern = 8) {
  try { navigator.vibrate?.(pattern); } catch {}
}

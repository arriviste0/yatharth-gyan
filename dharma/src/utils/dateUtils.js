const WEEKDAYS_DEVANAGARI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateDisplay(date) {
  const d = new Date(date);
  const dayEn = WEEKDAYS_EN[d.getDay()];
  const dayDev = WEEKDAYS_DEVANAGARI[d.getDay()];
  const month = MONTHS_EN[d.getMonth()];
  return {
    dayEn,
    dayDev,
    full: `${dayEn}, ${d.getDate()} ${month} ${d.getFullYear()}`,
    short: `${d.getDate()} ${month}`,
  };
}

export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday = 0
  return new Date(d.setDate(diff));
}

export function getWeekKey(date) {
  const ws = getWeekStart(date);
  return dateKey(ws);
}

export function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 23 || hour < 4;
}

export function isAfterElevenPM() {
  const hour = new Date().getHours();
  return hour >= 23;
}

export function isAfterTenPM() {
  const hour = new Date().getHours();
  return hour >= 22;
}

export function isSundayEvening() {
  const d = new Date();
  return d.getDay() === 0 && d.getHours() >= 21;
}

export function getLast90Days() {
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(dateKey(d));
  }
  return days;
}

export function getLast8Weeks() {
  const weeks = [];
  const today = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    const ws = getWeekStart(d);
    weeks.push({ key: dateKey(ws), label: `W${8 - i}` });
  }
  return weeks;
}

export function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

export function formatRelativeDate(dateStr) {
  const today = new Date();
  const date = new Date(dateStr);
  const diff = Math.round((today - date) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return `${Math.floor(diff / 30)} months ago`;
}

export function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  return `${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Open-Meteo devuelve horarios locales de la ciudad consultada ("2026-10-29T14:00")
 * y su offset UTC. Convertimos todo a instantes absolutos (Date) y formateamos
 * siempre en la zona horaria de la ciudad, no en la del navegador.
 */
export function parseLocal(iso: string, utcOffsetSeconds: number): Date {
  const [datePart, timePart = '00:00'] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - utcOffsetSeconds * 1000);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = timeZone + JSON.stringify(options);
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('es-AR', { timeZone, ...options });
    formatters.set(key, f);
  }
  return f;
}

export function formatTime(date: Date, timeZone: string): string {
  return formatter(timeZone, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

export function formatHour(date: Date, timeZone: string): string {
  return formatter(timeZone, { hour: '2-digit', hour12: false }).format(date) + ' h';
}

export function formatWeekday(date: Date, timeZone: string): string {
  const s = formatter(timeZone, { weekday: 'short' }).format(date).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatLongDate(date: Date, timeZone: string): string {
  const s = formatter(timeZone, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isSameLocalDay(a: Date, b: Date, timeZone: string): boolean {
  const f = formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return f.format(a) === f.format(b);
}

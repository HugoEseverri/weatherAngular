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

function formatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + timeZone + JSON.stringify(options);
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { timeZone, ...options });
    formatters.set(key, f);
  }
  return f;
}

/** En español usamos reloj de 24 h; en inglés, el formato habitual de 12 h. */
function clock(locale: string): Intl.DateTimeFormatOptions {
  return locale.startsWith('es') ? { hourCycle: 'h23' } : { hour12: true };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatTime(date: Date, timeZone: string, locale = 'es-AR'): string {
  const hour = locale.startsWith('es') ? '2-digit' : 'numeric';
  return formatter(locale, timeZone, { hour, minute: '2-digit', ...clock(locale) }).format(date);
}

export function formatHour(date: Date, timeZone: string, locale = 'es-AR'): string {
  if (locale.startsWith('es')) {
    return formatter(locale, timeZone, { hour: '2-digit', hourCycle: 'h23' }).format(date) + ' h';
  }
  return formatter(locale, timeZone, { hour: 'numeric', hour12: true }).format(date);
}

export function formatWeekday(date: Date, timeZone: string, locale = 'es-AR'): string {
  return capitalize(formatter(locale, timeZone, { weekday: 'short' }).format(date).replace('.', ''));
}

export function formatLongDate(date: Date, timeZone: string, locale = 'es-AR'): string {
  return capitalize(formatter(locale, timeZone, { weekday: 'long', day: 'numeric', month: 'long' }).format(date));
}

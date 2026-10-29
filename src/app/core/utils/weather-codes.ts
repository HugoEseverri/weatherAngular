import { ConditionKind } from '../models/weather.models';

interface CodeInfo {
  label: string;
  kind: ConditionKind;
}

/** Códigos WMO usados por Open-Meteo. */
const WMO_CODES: Record<number, CodeInfo> = {
  0: { label: 'Despejado', kind: 'clear' },
  1: { label: 'Mayormente despejado', kind: 'clear' },
  2: { label: 'Parcialmente nublado', kind: 'partly-cloudy' },
  3: { label: 'Nublado', kind: 'cloudy' },
  45: { label: 'Niebla', kind: 'fog' },
  48: { label: 'Niebla helada', kind: 'fog' },
  51: { label: 'Llovizna ligera', kind: 'drizzle' },
  53: { label: 'Llovizna', kind: 'drizzle' },
  55: { label: 'Llovizna intensa', kind: 'drizzle' },
  56: { label: 'Llovizna helada', kind: 'drizzle' },
  57: { label: 'Llovizna helada intensa', kind: 'drizzle' },
  61: { label: 'Lluvia ligera', kind: 'rain' },
  63: { label: 'Lluvia', kind: 'rain' },
  65: { label: 'Lluvia intensa', kind: 'rain' },
  66: { label: 'Lluvia helada', kind: 'rain' },
  67: { label: 'Lluvia helada intensa', kind: 'rain' },
  71: { label: 'Nevada ligera', kind: 'snow' },
  73: { label: 'Nevada', kind: 'snow' },
  75: { label: 'Nevada intensa', kind: 'snow' },
  77: { label: 'Granizo fino', kind: 'snow' },
  80: { label: 'Chubascos ligeros', kind: 'rain' },
  81: { label: 'Chubascos', kind: 'rain' },
  82: { label: 'Chubascos fuertes', kind: 'rain' },
  85: { label: 'Chubascos de nieve', kind: 'snow' },
  86: { label: 'Chubascos de nieve fuertes', kind: 'snow' },
  95: { label: 'Tormenta', kind: 'thunder' },
  96: { label: 'Tormenta con granizo', kind: 'thunder' },
  99: { label: 'Tormenta fuerte con granizo', kind: 'thunder' },
};

export function describeCode(code: number): CodeInfo {
  return WMO_CODES[code] ?? { label: 'Desconocido', kind: 'cloudy' };
}

export function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

export function uvLevel(uv: number): { label: string; tone: string } {
  if (uv < 3) return { label: 'Bajo', tone: 'good' };
  if (uv < 6) return { label: 'Moderado', tone: 'fair' };
  if (uv < 8) return { label: 'Alto', tone: 'poor' };
  if (uv < 11) return { label: 'Muy alto', tone: 'bad' };
  return { label: 'Extremo', tone: 'severe' };
}

export function aqiLevel(aqi: number): { label: string; tone: string; advice: string } {
  if (aqi <= 20) return { label: 'Excelente', tone: 'good', advice: 'Aire limpio, ideal para actividades al aire libre.' };
  if (aqi <= 40) return { label: 'Buena', tone: 'good', advice: 'Calidad del aire satisfactoria.' };
  if (aqi <= 60) return { label: 'Moderada', tone: 'fair', advice: 'Personas sensibles deberían moderar el esfuerzo.' };
  if (aqi <= 80) return { label: 'Mala', tone: 'poor', advice: 'Reducí la actividad física intensa al aire libre.' };
  if (aqi <= 100) return { label: 'Muy mala', tone: 'bad', advice: 'Evitá la actividad prolongada al aire libre.' };
  return { label: 'Extrema', tone: 'severe', advice: 'Permanecé en interiores si es posible.' };
}
